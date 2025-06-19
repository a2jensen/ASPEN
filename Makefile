build:
	jlpm run build
	jlpm run watch

delete:
	rm -rf node_modules
	rm -rf .yarn
	rm -rf lib
	rm tsconfig.tsbuildinfo

# ensures tasks are always executed
.PHONY: build