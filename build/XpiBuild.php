<?php
class XpiBuild {
	const API_SERVER = 'https://addons.mozilla.org/api/v3/';
	private $handle = null;
	private $temp_output = null;
	private $_xpiName = null;
	private $user = null;
	private $secret = null;
	private $version = null;
	private $ext_name = null;
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
        $options['output_dir'] = trim(@$options['output_dir']);
        if (!isset($options['output_dir'][0])) {
            $options['output_dir'] = '.';
        }
        $options['output_dir'] = rtrim($options['output_dir'], '\\/') . '/';

        $this->_xpiName = $options['name'];
        $this->options = $options;

    }
    public function initZip($to)
    {
        $this->handle = new PharData($to, null, null, PHAR::ZIP);
    }
	public function zip() {
        $this->handle->compressFiles(PHAR::GZ);
	}
	public function addFile($name, $as = NULL) {
		if ($as === NULL) {
			$as = $name;
		}
		$this->handle->addFile($name, $as);
		if ($as === 'manifest.json') {
			$f = json_decode(file_get_contents($name), 1);
			$this->version = $f['version'];
			$this->ext_name = $f['applications']['gecko']['id'];
			$this->_xpiName .= '-' . $f['version'];
		}
	}
	public function addString($as, $content) {
		$this->handle->addFromString($as, $content);
		if ($as === 'manifest.json') {
			$f = json_decode($content, 1);
			$this->version = $f['version'];
			$this->ext_name = $f['applications']['gecko']['id'];
			$this->_xpiName .= '-' . $f['version'];
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
    public function build() {
        $zipFile = $this->options['output_dir'] . $this->_xpiName . '.xpi';
        $this->zip();
		if (is_file($zipFile)) {
			@unlink($zipFile);
		}
		copy($this->temp_output, $zipFile);
		@unlink($this->temp_output);
	}
	public function setApi($user, $secret) {
		$this->user = $user;
		$this->secret = $secret;
	}
	public function getJWTEncode($r, $secret) {
		$r = hash_hmac('sha256', $r, $secret, TRUE);
		$r = str_replace('=', '', strtr(base64_encode($r), '+/', '-_'));
		return $r;
	}
	public function getJWT() {
		$header = array('typ' => 'JWT', 'alg' => 'HS256');
        $segments = array();
        $segments[] = str_replace('=', '', strtr(base64_encode(json_encode($header)), '+/', '-_'));
		$payload = [
			"iss" => $this->user,
			"jti" => uniqid(),
			"iat" => time(),
			"exp" => time() + (4.5 * 60) // 4 mintunes and 30 seconds
		];
        $segments[] = str_replace('=', '', strtr(base64_encode(json_encode($payload)), '+/', '-_'));
        $signing_input = implode('.', $segments);
        $segments[] = $this->getJWTEncode($signing_input, $this->secret);
		return implode('.', $segments);
	}
	public function getCurl($url) {
		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: JWT ' . $this->getJWT()]);
		return $ch;
	}
	public function sign() {
		$ch = $this->getCurl(self::API_SERVER . 'addons/' . $this->ext_name . '/versions/' . $this->version . '/');
		curl_setopt($ch, CURLOPT_POSTFIELDS, ['upload' => new CURLFile($this->options['output_dir'] . $this->_xpiName . '.xpi')]);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
		$r = curl_exec($ch);
		@curl_close($ch);
		$ch = $this->getCurl(self::API_SERVER . 'addons/' . $this->ext_name . '/versions/' . $this->version . '/');
		$version_info = json_decode(curl_exec($ch), 1);
		@curl_close($ch);
		if ($version_info['automated_signing']) {
			while (!$version_info['passed_review'] || !$version_info['processed'] || !$version_info['reviewed'] || !$version_info['valid']) {
				$ch = $this->getCurl(self::API_SERVER . 'addons/' . $this->ext_name . '/versions/' . $this->version . '/');
				$version_info = json_decode(curl_exec($ch), 1);
				@curl_close($ch);
			}
			//download signed file
			$sign_file = NULL;
			foreach ($version_info['files'] as $k => $v) {
				if ($v['signed']) {
					$sign_file = $v;
					break;
				}
			}
			$ch = $this->getCurl($sign_file['download_url']);
			file_put_contents($this->options['output_dir'] . $this->_xpiName . '-signed.xpi', curl_exec($ch));
			@curl_close($ch);
			return $sign_file['hash'];
		}
	}
}