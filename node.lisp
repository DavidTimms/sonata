(
	(= sayHello (function ((= name "mate")) (
		(console.log "Hello" name)
	)))
	(sayHello)
	(sayHello "Dave")
)