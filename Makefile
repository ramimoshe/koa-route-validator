.PHONY: all test clean
test:
	npm run test
start:
	npm start

install:
	npm install


cov:
	npm run test-coverage

cov-html:
	npm run test-coverage-html

cov-mac:
	npm run test-coverage-html
	open -a Safari ./test/coverage.html

