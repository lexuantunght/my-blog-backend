const AppConfig = new (class AppConfig {
	get mongodb_url() {
		return process.env.MONGODB_URL || '';
	}

	get port() {
		return process.env.PORT || 8080;
	}

	get cryptoIV() {
		return process.env.CRYPTO_IV;
	}

	get clientSEK() {
		return process.env.CLIENT_SEK;
	}

	get dbAdapterType() {
		return 1;
	}
})();

export default AppConfig;
