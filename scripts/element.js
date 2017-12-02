function findParent(el, check) {
	while (el.parentElement) {
		if (check(el.parentElement)) {
			return el.parentElement;
		} else {
			el = el.parentElement
		}
	}
	return null;
}

function mdlRadioSet(name, val, p) {
	if (p === undefined) {
		p = document;
	}
	const o = p.querySelector('input[name="' + name + '"]:checked');
	if (o !== null) {
		if (o.value === val) {
			return;
		}
		o.parentElement.classList.remove('is-checked');
		o.checked = false;
	}
	let e = null;
	const all = Array.prototype.slice.call(p.querySelectorAll('input[name="' + name + '"]'));
	for (let x of all) {
		if (x.value === val) {
			e = x;
			break;
		}
	}
	console.log(all);
	if (e === null) {
		e = all[0];
	}
	e.parentElement.classList.add('is-checked');
	e.checked = true;
}

function mdlRadioDisable(name, disable, p) {
	if (p === undefined) {
		p = document;
	}
	p.querySelectorAll('input[name="' + name + '"]').forEach(e => {
		e.disabled = disable;
		e.parentElement.classList[disable ? "add" : "remove"]('is-disabled');
	});
}

function mdlSetValue(el, value) {
	el.value = value;
	if (value === '') {
		el.parentElement.classList.remove('is-dirty');
	} else {
		el.parentElement.classList.add('is-dirty');
	}
}