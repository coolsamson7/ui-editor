# UiEditor

UIEditor is a wisiwyg html editor implemented with AngularJS 2.x. The available components - as seen in the palette to the left - can be dragged onto the main area - or alternatively the component tree - and will be instanciated as children of the corresponding parent element. A property editor onn the right side is used to modify corresponding properties. These are either normal html properties or properties which make sense in an Angular environment - e.g. 'click'.
Layout elements - such as rows and columns  are based on bootstrap 3.x.

## Basic Idea

The basic idea is a rendering engine, that knows about different types of components as organized in a central component registry. Every component is defined by
* a number of properties ( with corresponding type information ), and
* a template string containing static content as well as placeholders that will be filled by dynamic data.

The payload data on the other hand is a simple javascript object referencing the component type and specific property values.
A special property - '$children' references any component children.

Let's look at a simple example:

## Project Setup
This project was generated with [angular-cli](https://github.com/angular/angular-cli) version 1.0.0-beta.28.3.

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Deploying to GitHub Pages

Run `ng github-pages:deploy` to deploy to GitHub Pages.

## Further help

To get more help on the `angular-cli` use `ng help` or go check out the [Angular-CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
