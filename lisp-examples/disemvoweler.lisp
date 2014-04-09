(
	(= vowels ["a" "e" "i" "o" "u"])
	(= input ((list.fromArray process.argv) 2))
	(= chars (list.fromArray(input.split "")))
	(= seperated (chars.reduce {(con []) (vow [])} (function (stacks char) (
		(if (contains vowels char) (
			{(con stacks.con) (vow (stacks.vow.append char))}
		) (
			{(con (stacks.con.append char)) (vow stacks.vow)}
		))
	))))
	(print (seperated.con.join ""))
	(print (seperated.vow.join ""))
)