import mongoose from "mongoose";

type MongoModel = mongoose.Model<any>;

declare namespace mongo {
	enum mongoConnectionState {
		disconnected = 0,
		connected = 1,
		connecting = 2,
		disconnecting = 3
	}
	function connect(mongodbConnection: string): Promise<boolean>;
	function model(name: string, schema: mongoose.Schema): MongoModel;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entities) => Promise<any>;
	function remove(mongomodel: MongoModel): (any?: Object) => Promise<boolean>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (any?: Object) => Promise<any>;
	function disconnect(): Promise<void>;
}
