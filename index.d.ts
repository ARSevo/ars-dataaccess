import mongoose from "mongoose";

type MongoModel = mongoose.Model<any>;
export enum mongoConnectionState {
		disconnected = 0,
		connected = 1,
		connecting = 2,
		disconnecting = 3
	}

declare namespace mongo {
	function connect(mongodbConnection: string): Promise<boolean>;
	function model(name: string, schema: mongoose.Schema): MongoModel;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entity) => Promise<any>;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entities: any[]) => Promise<any[]>;
	function remove(mongomodel: MongoModel): (query?: Object) => Promise<boolean>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (query?: Object) => Promise<any>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (query?: Object) => Promise<any[]>;
	function disconnect(): Promise<void>;
}

declare namespace mongomock {
	function connect(mongodbConnection: string): Promise<boolean>;
	function model(name: string, schema: mongoose.Schema): MongoModel;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entity) => Promise<any>;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entities: any[]) => Promise<any[]>;
	function remove(mongomodel: MongoModel): (query?: Object) => Promise<boolean>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (query?: Object) => Promise<any>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (query?: Object) => Promise<any[]>;
	function disconnect(): Promise<void>;
}

declare namespace sql {
	function connect(connectionParams) : Promise<any>;
}