const mongoose = require('mongoose')
const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const passport = require('passport')
const session = require('express-session')
const bodyParser = require('body-parser')
const LocalStrategy = require('passport-local').Strategy
import UserModel, { User } from './schema/UserSchema'

const sessionMiddleware = session({
	secret: 'cat-is-my-pet',
	resave: false,
	saveUninitialized: false
})
app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

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
				console.log('Connection success')
				this.initExpress()
				this.initPassport()
				this.initSocketMiddleware()
				this.initSocket()
			})
			.catch(error => {
				console.error(error)
			})
	}
	
	public async createUser ({ name, password }: {
		name: string;
		password: string
	}): Promise<User> {
		let user = new UserModel({
			_id: new mongoose.Types.ObjectId(),
			name,
			password
		})
		return await user.save()
	}
	
	public initPassport (): void {
		passport.use(
			new LocalStrategy(async (name, password, done) => {
				try {
					const doc = await UserModel.exists({ name, password })
					if (doc) {
						return done(null, doc)
					} else {
						const user = await this.createUser({
							name,
							password
						})
						return done(null, user)
					}
				} catch (error) {
					return done(null, false)
				}
			})
		)
		passport.serializeUser((user, cb) => {
			console.log(`serializeUser ${user.id}`);
			cb(null, user.id);
		});
		passport.deserializeUser((id, cb) => {
			console.log(`deserializeUser ${id}`);
			cb(null, {});
		});
	}
	
	public initSocketMiddleware (): void {
		const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
		io.use(wrap(sessionMiddleware))
		io.use(wrap(passport.initialize()))
		io.use(wrap(passport.session()))
		io.use((socket, next) => {
			if (socket.request.user) {
				next()
			} else {
				next(new Error('unauthorized'))
			}
		})
	}
	
	public initSocket (): void {
		io.on('connect', socket => {
			console.log('New connection', socket.id)
			const session = socket.request.session
			session.socketId = socket.id
			session.save()
			socket.on('login', cb => {
				console.log(cb)
				cb(socket.request.user ? socket.request.user.username : '')
			})
		})
	}
	
	public initExpress (): void {
		app.get('/', (req, res) => {
			const isAuthenticated = !!req.user;
			if (isAuthenticated) {
				console.log(`user is authenticated, session is ${req.session.id}`);
			} else {
				console.log("unknown user");
			}
			res.sendFile(isAuthenticated ? "index.html" : "login.html", { root: __dirname });
		})
		app.post(
			"/login",
			passport.authenticate("local", {
				successRedirect: "/",
				failureRedirect: "/",
			})
		)
		app.post("/logout", (req, res) => {
			console.log(`logout ${req.session.id}`);
			const socketId = req.session.socketId;
			if (socketId && io.of("/").sockets.get(socketId)) {
				console.log(`forcefully closing socket ${socketId}`);
				io.of("/").sockets.get(socketId).disconnect(true);
			}
			req.logout();
			res.cookie("connect.sid", "", { expires: new Date() });
			res.redirect("/");
		})
	}
}

server.listen(8090, () => {
	const backend = new Backend()
	console.log('app is running at http://localhost:8090')
})
