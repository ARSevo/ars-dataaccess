import mongoose from "mongoose";

type MongoModel = mongoose.Model<T>;
const mc = modelConvertor;

declare namespace mongo {
	declare const Schema = mongoose.Schema;
	declare const mongoConnectionState = {
		disconnected: 0,
		connected: 1,
		connecting: 2,
		disconnecting: 3
	};
	declare function connect(mongodbConnection: string): Promise<boolean>;
	declare function model(name: stirng, schema: mongoose.Schema): MongoModel;
	declare function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entities) => Promise<any>;
	declare function remove(mongomodel: MongoModel): (any?: Object) => Promise<boolean>;
	declare function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (any?: Object) => Promise<T>;
	declare function disconnect(): Promise<void>;
}
