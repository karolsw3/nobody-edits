import Phaser from 'phaser'
import './css/index.css'
import './vue'
import logoImg from './assets/logo.png'

class MyGame extends Phaser.Scene
{
	constructor (config) {
		super(config)
	}
	
	preload () {
		this.load.image('logo', logoImg)
	}
	
	create () {
		const logo = this.add.image(400, 150, 'logo')
		
		this.tweens.add({
			targets: logo,
			y: 150,
			duration: 2000,
			ease: "Power2",
			yoyo: true,
			loop: -1
		})
	}
}

const config = {
	type: Phaser.AUTO,
	parent: 'nobody-edits',
	width: 700,
	height: 500,
	scene: MyGame
};

const game = new Phaser.Game(config)
