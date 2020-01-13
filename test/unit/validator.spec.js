const ServiceBroker = require("../../src/service-broker");
const Validator = require("../../src/validator");
const { ValidationError } = require("../../src/errors");

const broker = new ServiceBroker({ logger: false });

describe("Test constructor", () => {

	it("should create instance", () => {
		let v = new Validator();
		expect(v).toBeDefined();
		expect(v.compile).toBeInstanceOf(Function);
		expect(v.validate).toBeInstanceOf(Function);
		expect(v.middleware).toBeDefined();
	});

	it("should save the broker in init", () => {
		let v = new Validator();

		v.init(broker);
		expect(v.broker).toBe(broker);
	});
});

describe("Test Validator.compile", () => {

	let v = new Validator();
	v.validator.compile = jest.fn(() => true);

	it("should call parent compile", () => {
		v.compile({});

		expect(v.validator.compile).toHaveBeenCalledTimes(1);
	});
});

describe("Test Validator.validate", () => {

	let v = new Validator();
	v.validator.validate = jest.fn(() => true);

	it("should call parent validate", () => {
		v.validate({}, {});

		expect(v.validator.validate).toHaveBeenCalledTimes(1);
	});

	it("should throw ValidationError if object is NOT valid", () => {
		let v = new Validator();
		v.validator.validate = jest.fn(() => []);
		expect(() => {
			v.validate({}, {});

		}).toThrow(ValidationError);
	});
});

describe("Test middleware localAction", () => {
	let v = new Validator();
	let __checkGood = jest.fn(() => true);
	let __checkBad = jest.fn(() => []);
	v.compile = jest.fn().mockImplementationOnce(() => __checkGood).mockImplementationOnce(() => __checkBad);
	v.validate = jest.fn();
	v.init(broker);

	it("should return a middleware object", () => {
		let mw = v.middleware();
		expect(mw).toEqual({
			name: "Validator",
			localAction: expect.any(Function),
			localEvent: expect.any(Function),
		});
	});

	it("should call validator & handler", () => {
		let mw = v.middleware(broker);

		let mockAction = {
			name: "posts.find",
			params: {
				id: "number",
				name: "string"
			},
			handler: jest.fn(() => Promise.resolve())
		};

		// Create wrapped handler
		let wrapped = mw.localAction(mockAction.handler, mockAction);
		expect(typeof wrapped).toBe("function");

		expect(v.compile).toHaveBeenCalledTimes(1);
		expect(v.compile).toHaveBeenCalledWith({ "id": "number", "name": "string" });


		// Create fake context
		let ctx = { params: { id: 5, name: "John" } };

		// Call wrapped function
		return wrapped(ctx).then(() => {
			expect(__checkGood).toHaveBeenCalledTimes(1);
			expect(__checkGood).toHaveBeenCalledWith({ "id": 5, "name": "John" });
			expect(mockAction.handler).toHaveBeenCalledTimes(1);
		});
	});

	it("should call validator & throw error & not call handler", () => {
		let mw = v.middleware(broker);

		let mockAction = {
			name: "posts.find",
			params: {
				id: "number",
				name: "string"
			},
			handler: jest.fn(() => Promise.resolve())
		};

		// Create wrapped handler
		let wrapped = mw.localAction(mockAction.handler, mockAction);
		expect(typeof wrapped).toBe("function");
		// Create fake context with wrong params
		let ctx = { params: { id: 5, fullName: "John" } };

		// Call wrapped function
		return wrapped(ctx).catch(err => {
			expect(err).toBeInstanceOf(ValidationError);
			expect(mockAction.handler).toHaveBeenCalledTimes(0);
		});
	});

	it("should call handler because the params is NOT exist", () => {
		v.validate.mockClear();
		let mockAction = {
			name: "posts.find",
			handler: jest.fn()
		};

		let wrapped = v.middleware().localAction(mockAction.handler, mockAction);
		expect(typeof wrapped).toBe("function");

		let ctx = { params: { id: 5, name: "John" } };
		wrapped(ctx);

		expect(v.validate).toHaveBeenCalledTimes(0);
		expect(mockAction.handler).toHaveBeenCalledTimes(1);
	});

});

describe("Test middleware localEvent", () => {
	let v = new Validator();
	v.init(broker);
	let __checkGood = jest.fn(() => true);
	let __checkBad = jest.fn(() => []);
	v.compile = jest.fn().mockImplementationOnce(() => __checkGood).mockImplementationOnce(() => __checkBad);
	v.validate = jest.fn();

	it("should return a middleware object", () => {
		let mw = v.middleware();
		expect(mw).toEqual({
			name: "Validator",
			localAction: expect.any(Function),
			localEvent: expect.any(Function),
		});
	});

	it("should call validator & handler", () => {
		let mw = v.middleware(broker);

		let mockEvent = {
			name: "posts.find",
			params: {
				id: "number",
				name: "string"
			},
			handler: jest.fn(() => Promise.resolve())
		};

		// Create wrapped handler
		let wrapped = mw.localEvent(mockEvent.handler, mockEvent);
		expect(typeof wrapped).toBe("function");

		expect(v.compile).toHaveBeenCalledTimes(1);
		expect(v.compile).toHaveBeenCalledWith({ "id": "number", "name": "string" });


		// Create fake context
		let ctx = { params: { id: 5, name: "John" } };

		// Call wrapped function
		return wrapped(ctx).then(() => {
			expect(__checkGood).toHaveBeenCalledTimes(1);
			expect(__checkGood).toHaveBeenCalledWith({ "id": 5, "name": "John" });
			expect(mockEvent.handler).toHaveBeenCalledTimes(1);
		});
	});

	it("should call validator & throw error & not call handler", () => {
		let mw = v.middleware(broker);

		let mockEvent = {
			name: "posts.find",
			params: {
				id: "number",
				name: "string"
			},
			handler: jest.fn(() => Promise.resolve())
		};

		// Create wrapped handler
		let wrapped = mw.localEvent(mockEvent.handler, mockEvent);
		expect(typeof wrapped).toBe("function");
		// Create fake context with wrong params
		let ctx = { params: { id: 5, fullName: "John" } };

		// Call wrapped function
		return wrapped(ctx).catch(err => {
			expect(err).toBeInstanceOf(ValidationError);
			expect(mockEvent.handler).toHaveBeenCalledTimes(0);
		});
	});

	it("should call handler because the params is NOT exist", () => {
		v.validate.mockClear();
		let mockEvent = {
			name: "posts.find",
			handler: jest.fn()
		};

		let wrapped = v.middleware().localEvent(mockEvent.handler, mockEvent);
		expect(typeof wrapped).toBe("function");

		let ctx = { params: { id: 5, name: "John" } };
		wrapped(ctx);

		expect(v.validate).toHaveBeenCalledTimes(0);
		expect(mockEvent.handler).toHaveBeenCalledTimes(1);
	});

});
