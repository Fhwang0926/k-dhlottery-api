# Node.js dhapi - Makefile (원본 dhlottery-api Makefile 참고)

build: clean
	npm run build

.PHONY: build

clean:
	npm run clean

.PHONY: clean

check:
	npm run lint

.PHONY: check

lintfmt:
	npm run lint:fix

.PHONY: lintfmt

test:
	npm test

.PHONY: test
