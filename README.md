# Liferay Remote Blog Editor

Demonstrate how a blog editor built with React can be integrated as a Remote App in Liferay 7.4.

## Getting Started

Clone this repo and run:
```
docker-compose up --build
```

Once Liferay is started:
- Go to http://localhost:8080
- Login as admin (default is `test@liferay.com:test`)
- Open the mega menu (top right)
- Go to *Applications > Custom Apps > Remote Apps*
- Click on the `+` button
- Give it a *Name* (e.g. Blog Editor)
- For *Type*, select `Custom Element`
- For *HTML Element Name*, add `blog-editor`
- For *URL*, add `http://localhost:3000/static/js/bundle.js`

Now, go to any page and you should be able to deploy your custom app as a widget on the page.

With this docker setup, you can open the React App in an editor, make any change and it should be hot reloaded on Liferay.

Note that [a CORS config example](liferay/files/osgi/configs/com.liferay.portal.remote.cors.configuration.WebContextCORSConfiguration_default.config) is automatically deployed at startup to make this Remote App work within Liferay.

## License
[MIT](LICENSE)
