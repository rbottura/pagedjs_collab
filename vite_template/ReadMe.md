# EPE - Ecran-Papier-Editer

## viteES6Template

[https://gitlab.com/esad-gv1/epe/vitees6template](https://gitlab.com/esad-gv1/epe/vitees6template)

This project is an extension of [advancedTemplateES6](https://gitlab.com/esad-gv1/epe/advancedtemplatees6). It uses the same idea but aims to take it to a further step.
`Vite` is used to provide a development environement, making it possible the use `Node.js` and `npm modules`. In comparison to the [advancedTemplateES6](https://gitlab.com/esad-gv1/epe/advancedtemplatees6), the use of `Vite` make it possible to generate the project distribution through a kind of compilation that can be thourouhly configured (see [https://vitejs.dev/config/](https://vitejs.dev/config/). In this project, the sources to be edited are in the `src`folder. The resulting build is located in the `public`folder, to facilitate the publishin of the website as a `GitLab Page`.

`index.html` file is the main entrie for the website. It is used to give the first document structure that can be used in the project and it will load the main script file :
```html
<script type="module" src="main.js"></script>
```
`main.js` is the main entrie for `Vite` to import the necessary files. It is used as the script that provides a way to handle the website part of the projet, and also provides functions to paginate the given content with `Paged.js`.

## Usage

Clone this repository or download it as a zip archive. From a Terminal :

> `cd` to the folder on your disk

> `npm i` to install the requiered node modules described in the `package.json` file

> `npm run watch` to run `Vite` in watch mode (all your changes to sources will be taken in account in realtime)

> `npm run preview` to launch a local server. You should have a log like this one in your Terminal :
```
➜  Local:   http://localhost:4173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Once this steps are done, you can develop your project as any other web project.

### Some useful Vite tricks

CSS are managed by `Vite` through a special `import` rule :

```javascript
import "./src/css/style.css";
import "./src/css/cover.css";
import "./src/css/content.css";
import "./src/css/back.css";
```
It means that you don't need to use standard `<link>` or `<style>` elements in your project. Consequently, the `paginate.js` script uses a different call to Paged.js :

```javascript
await paged.preview(documentFragment, null, document.body);
```
Where the 2nd argument should be a style descriptions array we just pass `null` because the CSS including the `@media print` rules are already loaded by `Vite`. **This can be a limitation and we have another template that isolate Paged.js into an iFrame to avoid a certain CSS *leakage* : CSS used for the screen part of the project gets applied to the Paged.js version even when not wanted**

To load files in their raw format and avoid automatic transformations made by `Vite`, you should use `?raw` at the end of your import instruction :

```javascript
import cover from "./src/md/cover.md?raw";
```

Later on, the variable representing the file's content can be used as any other :

```javascript
//markdown files to load
const mdFilesList = [cover, content, back];
```

## Project structure

```
.
├── EPE.svg
├── ReadMe.md
├── index.html
├── main.js
├── package-lock.json
├── package.json
├── public
├── src
│   ├── css
│   │   ├── GitHub Flavor.css
│   │   ├── back.css
│   │   ├── content.css
│   │   ├── cover.css
│   │   ├── fonts
│   │   │   ├── Inter-VariableFont_slnt_wght.ttf
│   │   │   ├── Path-C.woff
│   │   │   ├── Path-CBold.woff
│   │   │   ├── Path-CHeavy.woff
│   │   │   ├── Path-R.woff
│   │   │   ├── Path-RBold.woff
│   │   │   ├── Path-RHeavy.woff
│   │   │   └── Path-RMono.woff
│   │   ├── paged-preview.css
│   │   ├── pagedjs-interface.css
│   │   └── style.css
│   ├── js
│   │   ├── handlers
│   │   │   ├── HighlightAreas.js
│   │   │   ├── LayerTest.js
│   │   │   └── Skeleton.js
│   │   ├── paginate.js
│   │   └── utils.js
│   └── md
│       ├── back.md
│       ├── content.md
│       └── cover.md
└── vite.config.js
```

## Dependencies

* highlight.js
* markdown-it
* markdown-it-attrs
* markdown-it-container
* markdown-it-footnote
* markdown-it-sub
* markdown-it-sup
* pagedjs
* vite

## Credits

* [Markdown-it](https://www.npmjs.com/package/markdown-it) for converting markdown to html in the browser;
* [Paged.js](https://pagedjs.org) for printed page layout and pdf generation;
* [Vite.js](https://vitejs.dev) Front end tooling.

## Authors

Dominique Cunin