<?php
class CrxBuild
{
    const CRX_FORMAT_VERSION = 2;
	private $handle = null;
    private $_privateKey = null;
    private $_privateKeyDetails = null;
	private $temp_output = null;
	private $_crxName = null;
    public function __construct($options)
    {
        self::checkRequirements();
        $this->_setOptions($options);
		$this->temp_output = sys_get_temp_dir() . '/' . md5(uniqid()) . '.zip';
		$this->initZip($this->temp_output);
    }
    public static function checkRequirements()
    {
        $requirementFails = array();
        if (!extension_loaded('zlib')) {
            $requirementFails[] = "zlib extension";
        }
        if (!extension_loaded('openssl')) {
            $requirementFails[] = "openssl extension";
        }
        if ($requirementFails) {
            throw new Exception(
                'Requirements: ' . implode(', ', $requirementFails)
            );
        }
    }
    private function _setOptions($options)
    {
        $options['name'] = trim(@$options['name']);
        if (!isset($options['name'])) {
            throw new Exception('name is not set');
        }

        if (!isset($options['only_zip'])) {
            $options['only_zip'] = false;
        }
        $options['only_zip'] = (bool)$options['only_zip'];

        $options['key_file'] = trim(@$options['key_file']);
        if (!isset($options['key_file'][0]) && !$options['only_zip']) {
            throw new Exception('key_file is not set');
        }

        $options['output_dir'] = trim(@$options['output_dir']);
        if (!isset($options['output_dir'][0])) {
            $options['output_dir'] = '.';
        }
        $options['output_dir'] = rtrim($options['output_dir'], '\\/') . '/';

        $this->_crxName = $options['name'];
        $this->options = $options;

    }
    public function initZip($to)
    {
        $this->handle = new ZipArchive;
        $this->handle->open($to, ZipArchive::CREATE);
    }
	public function zip() {
        $this->handle->close();
	}
	public function addFile($name, $as = NULL) {
		if ($as === NULL) {
			$as = $name;
		}
		$this->handle->addFile($name, $as);
		if ($as === 'manifest.json') {
			$f = json_decode(file_get_contents($name), 1);
			$this->_crxName .= '-' . $f['version'];
		}
	}
	public function addString($as, $content) {
		$this->handle->addFromString($as, $content);
		if ($as === 'manifest.json') {
			$f = json_decode($content, 1);
			$this->_crxName .= '-' . $f['version'];
		}
	}
	public function addDir($name, $as = NULL) {
		if ($as === NULL) {
			$as = $name;
		}
		$dh = opendir($name);
		while ($f = readdir($dh)) {
			if ($f === '.' || $f === '..') {
				continue;
			}
			if (is_dir($name . '/' . $f)) {
				$this->addDir($name . '/' . $f, $as . '/' . $f);
			}
			if (is_file($name . '/' . $f)) {
				$this->addFile($name . '/' . $f, $as . '/' . $f);
			}
		}
		@closedir($dh);
		unset($dh);
	}
    public function getPublicDerKey()
    {
        $this->_readPrivateKey();
        $publicKeyPem = $this->_privateKeyDetails['key'];
        $publicKeyPemLines = explode("\n", trim($publicKeyPem));
        array_shift($publicKeyPemLines);
        array_pop($publicKeyPemLines);
        $publicKeyDer = implode("\n", $publicKeyPemLines);
        return base64_decode($publicKeyDer);
    }
    private function _readPrivateKey()
    {
        $keyFile = $this->options['key_file'];
        if (!is_file($keyFile) || !is_readable($keyFile)) {
            throw new Exception(
                'Private key file doesn\'t not exist or is not a readable file'
            );
        }
        $this->_privateKey = openssl_pkey_get_private(
            file_get_contents($keyFile)
        );
        if ($this->_privateKey) {
            $this->_privateKeyDetails = openssl_pkey_get_details(
                $this->_privateKey
            );
        }
        if (!$this->_privateKeyDetails) {
            throw new Exception('Wrong private key');
        }
    }
    public function build()
    {
        $sig = null;

        $zipFile = $this->options['output_dir'] . $this->_crxName . '.zip';
        $crxFile = $this->options['output_dir'] . $this->_crxName . '.crx';
        $this->zip();
		if (is_file($zipFile)) {
			@unlink($zipFile);
		}
		copy($this->temp_output, $zipFile);
		@unlink($this->temp_output);
        if ($this->options['only_zip']) {
            return;
        }
        $publicKeyDer = $this->getPublicDerKey();

        $zipFileContent = file_get_contents($zipFile);
        openssl_sign(
            $zipFileContent, $sig, $this->_privateKey, OPENSSL_ALGO_SHA1
        );

        if (!$sig) {
            throw new Exception('Can\'t create a signature for zip file');
        }

        $cr24 = "\x43\x72\x32\x34";
        $publicKeyDerLen = strlen($publicKeyDer);
        $sigLen = strlen($sig);

        $crxHeader = $cr24 . pack(
            'VVV', self::CRX_FORMAT_VERSION, $publicKeyDerLen, $sigLen
        );

        $crx = "$crxHeader$publicKeyDer$sig$zipFileContent";
        file_put_contents($crxFile, $crx);
        openssl_pkey_free($this->_privateKey);
    }
}
