import { model, Schema } from 'mongoose'

const UserSchema = new Schema({
	_id: String,
	username: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: false
	},
	password: {
		type: String,
		required: true
	}
})

export interface User {
	_id: string;
	username: string;
	email?: string;
	password: string;
}

export default model<User>('User', UserSchema)
