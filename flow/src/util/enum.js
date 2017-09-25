export class Enum {
  value:number|string;

  constructor(value:number|string = undefined) {
	if (value === undefined) {
	  if (typeof this.constructor.prototype.iota === 'undefined') {
		this.constructor.prototype.iota = 0;
	  }
	  value = this.constructor.prototype.iota++;
	}

	this.value = value;
  }

  getName():string {
	let found = undefined;
	Object.keys(this.constructor).forEach((k:string) => {
	  if (this.constructor[k].value === this.value) {
		found = k;
	  }
	});
	return found;
  }

  toString():string {
	return `${this.value}`;
  }

  static valueOf(value:number|string):undefined|this {
	let found = undefined;
	Object.keys(this).forEach((k:string) => {
	  if (this[k].value === value) {
		found = this[k];
	  }
	});
	return found;
  }
}
