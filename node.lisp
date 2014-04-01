(
	(= sayHello (function ((= name "mate")) (
		(console.log "Hello" name)
	)))
	(sayHello)
	(sayHello "Dave")
	(= person {
		(sayHello sayHello)
	})
	(= dave (mix person {
		(name "Dave")
		(age 21)
	}))
	(console.log dave)
)