(
	(def evaluate (function (op i stack tokens) (
		(if (tokens i) (
			(if (== (tokens i) op) (
				(= result (eval (& (Number (stack -1)) (& op (Number (tokens (+ i 1)))))))
				(evaluate op (+ i 2) (stack.replace -1 result) tokens)
			) (
				(evaluate op (+ i 1) (stack.append (tokens i)) tokens)
			))
		) (
			stack
		))
	)))

	(= str ((list.fromArray process.argv) 2))
	(= parts (list.fromArray (str.split " ")))
	(console.log (
		(evaluate "+" 0 [] 
		(evaluate "-" 0 [] 
		(evaluate "/" 0 [] 
		(evaluate "*" 0 [] parts)))) 0))
)