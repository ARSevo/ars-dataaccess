import mongoose, { Schema } from "mongoose";
import mssql from 'mssql';

type MongoModel = mongoose.Model<any>;
export enum mongoConnectionState {
	disconnected = 0,
	connected = 1,
	connecting = 2,
	disconnecting = 3
}

declare namespace mongo {
	const Schema: Schema
	/**
	 * Opens a connection to MongoDB with the given connection string
	 * @param mongodbConnection Connection string URL for MongoDB
	 * @param options Connection options for MongoDB
	 * @returns Promise wrapped around boolean
	 */
	function connect(mongodbConnection: string, options?: Object): Promise<boolean>;
	function stats(): Promise<any>;
	function model(name: string, schema: mongoose.Schema, collection: string): MongoModel;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entity) => Promise<any>;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entities: any[]) => Promise<any[]>;
	function remove(mongomodel: MongoModel): (query?: Object) => Promise<boolean>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (query?: Object) => Promise<any>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (query?: Object) => Promise<any[]>;
	function copyTo(mongomodel: MongoModel): () => Promise<void>;
	function disconnect(): Promise<void>;
	function validateObjectId(id: string): boolean;
}

declare namespace mongomock {
	const Schema: Schema;
	function connect(mongodbConnection: string): Promise<boolean>;
	function stats(): Promise<any>;
	function model(name: string, schema: mongoose.Schema): MongoModel;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entity) => Promise<any>;
	function save(mongomodel: MongoModel, modelconvertor: (entity) => MongoModel, selector: (entity) => Object): (entities: any[]) => Promise<any[]>;
	function remove(mongomodel: MongoModel): (query?: Object) => Promise<boolean>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (query?: Object) => Promise<any>;
	function fetch(mongomodel: MongoModel, domainConvertor: (model: MongoModel) => Object): (query?: Object) => Promise<any[]>;
	function disconnect(): Promise<void>;
}

declare class ConnectionParams {
	public user: string;
	public password: string;
	public server: string;
	public port: number;
	public database: string;
	constructor(user: string, password: string, server: string, port: number, database: string);
}

declare namespace sql {
	const sql: mssql;
	const transaction: mssql.Transaction;
	const pool: mssql.ConnectionPool;
	const ConnectionParams: ConnectionParams;
	function request(): mssql.Request;
	function connect(connectionParams: ConnectionParams): Promise<any>;
	function isConnected(): boolean;
	function disconnect(): Promise<void>;
}