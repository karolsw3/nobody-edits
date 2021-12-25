const mongoose = require('mongoose')
const express = require('express')
const app = express()
const index = require('http').createServer(app)
const io = require('socket.io')(index)
const passport = require('passport')
const session = require('express-session')
const bodyParser = require('body-parser')
const cors = require('cors')
const LocalStrategy = require('passport-local').Strategy
import UserModel, { User } from '../schema/UserSchema'

const sessionMiddleware = session({
	secret: 'cat-is-my-pet',
	resave: false,
	saveUninitialized: false
})
const corsOptions = {
	credentials: true,
	origin: [
		'http://localhost:8090'
	]
}

const connection = 'mongodb+srv://nobodyedits.srphr.mongodb.net/myFirstDatabase?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority'
const credentials = './certificates/X509-cert-8184015270082739082.pem'

class Backend {
	constructor () {
		this.connect()
	}
	
	private connect (): void {
		mongoose.connect(connection, {
			sslKey: credentials,
			sslCert: credentials
		})
			.then(() => {
				this.initExpress()
				this.initPassport()
				this.initSocketMiddleware()
				this.initSocket()
			})
			.catch(error => {
				console.error(error)
			})
	}
	
	public async createUser ({ username, password }: {
		username: string
		password: string
	}): Promise<User> {
		let user = new UserModel({
			_id: new mongoose.Types.ObjectId(),
			username,
			password
		})
		return await user.save()
	}
	
	public initPassport (): void {
		passport.use(
			'local-login',
			new LocalStrategy(async (username, password, done) => {
				try {
					const doc = await UserModel.findOne({ username, password })
					if (doc) {
						return done(null, doc)
					} else {
						return done(null, false, {
							message: 'User not found'
						})
					}
				} catch (error) {
					return done(error)
				}
			})
		)
		passport.use('local-register',
			new LocalStrategy(async (username, password, done) => {
				try {
					const doc = await UserModel.exists({ username })
					if (doc) {
						return done(null, false, {
							message: 'User already exists'
						})
					} else {
						const user = await this.createUser({ username, password })
						return done(null, user)
					}
				} catch (error) {
					done(error)
				}
			})
		)
		passport.serializeUser((user, cb) => {
			console.log('serializing user')
			console.log(user)
			cb(null, user._id)
		})
		passport.deserializeUser(async (_id, cb) => {
			console.log('deserializing user', _id)
			const user = await UserModel.findOne({ _id })
			cb(null, user)
		})
	}
	
	public initSocketMiddleware (): void {
		const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
		io.use(wrap(sessionMiddleware))
		io.use(wrap(passport.initialize()))
		io.use(wrap(passport.session()))
		io.use((socket, next) => {
			if (socket.request.user) {
				console.log('ah yes please enter')
				next()
			} else {
				console.log(socket.request.user)
				console.log(socket.request.session)
				console.log('so unauthorized so bad')
				next(new Error('unauthorized'))
			}
		})
	}
	
	public initSocket (): void {
		io.on('connect', socket => {
			console.log('connection nice')
			socket.on('test', () => {
				console.log('test')
			})
			const session = socket.request.session
			session.socketId = socket.id
			session.save()
		})
	}
	
	public initExpress (): void {
		app.use(sessionMiddleware)
		app.use(bodyParser.json())
		app.use(bodyParser.urlencoded({ extended: true }))
		app.use(cors(corsOptions))
		app.use(passport.initialize())
		app.use(passport.session())
		app.get('/', (req, res) => {
			res.sendFile(
				'public/index.html',
				{ root: __dirname }
			)
		})
		app.post(
			'/login',
			passport.authenticate('local-login', {
				successRedirect: "/",
				failureRedirect: "/",
			})
		)
		app.post(
			'/register',
			passport.authenticate('local-register', {
				successRedirect: "/",
				failureRedirect: "/",
			})
		)
		app.use('/', express.static(__dirname + '/public'))
		app.post('/logout', (req, res) => {
			const socketId = req.session.socketId
			if (socketId && io.of('/').sockets.get(socketId)) {
				io.of('/').sockets.get(socketId).disconnect(true)
			}
			req.logout()
			res.cookie('connect.sid', '', { expires: new Date() })
			res.redirect('/')
		})
	}
}

index.listen(8090, () => {
	const backend = new Backend()
	console.log('app is running at http://localhost:8090')
})
