(
	(= sayHello (fn ((= name "mate")) (
		(console.log "Hello" name)
	)))
	(sayHello)
	(sayHello "Dave")
	(= person {
		(sayHello sayHello)
		(name "John")
	})
	(# comment)
	(repeat (fn ((= x 0)) (
		(print x)
		(if (< x 10) (
			(continue (+ x 1))
		))
	)))

	(for x in ["a" "b" "c" "d"] (
		(print x)
	))

	(for key in person (
		(print key "->" (get person key))
	))

	(for chr in "foo" (
		(print chr)
	))
)