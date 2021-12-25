import Vue from 'vue'
import axios from 'axios'
// @ts-ignore
import { io } from 'socket.io-client'

new Vue({
	el: '#app',
	data: {
		message: 'Hello Vue!',
		openTab: 'home',
		loginUsername: '',
		loginPassword: '',
		registerUsername: '',
		registerPassword: '',
		registerPasswordRepeat: ''
	},
	methods: {
		async login (): Promise<void> {
			try {
				await axios.post('/login', {
					username: this.loginUsername,
					password: this.loginPassword
				}, {
					withCredentials: true
				})
				this.initSocket()
			} catch (error) {
				// Toast
			}
		},
		async register (): Promise<void> {
			if (this.registerPassword !== this.registerPasswordRepeat) {
				// Error
				throw new Error('Password don\'t match')
			}
			try {
				await axios.post('/register', {
					username: this.registerUsername,
					password: this.registerPassword
				}, {
					withCredentials: true
				})
				this.initSocket()
			} catch (error) {
				// Toast
			}
		},
		initSocket (): void {
			console.log('trying to init socket haha')
			const socket = io()
			socket.emit('test', null)
		}
	}
})
