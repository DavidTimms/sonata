(
	(= tail (function (items) (
		(items.slice 1)
	)))
	(= sum (function (items (= total 0)) (
		(if (== items.count 0) (
			total
		) (
			(sum (tail items) (+ total (items 0)))
		))
	)))
	(= xs (list.range 5000))
	(console.log (& "sum = " (sum xs)))
)