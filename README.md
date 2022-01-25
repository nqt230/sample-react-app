# CVWO Assignment Task Management App

This is a simple task management app created for the CVWO assignment. 
Done by: Ng Qi Ting, A0233137M

## Getting Started

### Running the app
1. [Fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo#forking-a-repository) this repo.
2. [Clone](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) **your** forked repo.
3. Open your terminal and navigate to the directory containing your cloned project.
4. Install dependencies for the project by entering this command:
```bash
yarn install
```
5. Run the app in development mode by entering this command:
```bash
yarn start
```
6. Open another terminal and navigate to the backend file located in the same directory. 
7. Install backend dependencies by entering this command:
```bash
go get .
```
8. Start the backend server by entering this command:
```bash
go run server
```
9. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

   
### Navigating the code
This is the main file structure
```
.
├── node_modules
├── backend
├── public
├── src
├── README.md
├── tsconfig.json
├── package.json
├── .eslintrc.js
├── .prettierrc.js
└── yarn.lock
```

Main directories/files to note:
* `backend` contains all the backend source code and server data.
* `src` usually includes all your source code. That is where most of your functional code will be.
* `README.md` is a form of documentation about the project. It is what you are reading right now.
* `package.json` contains important metadata, for example, the dependencies and available scripts in the project.
* `.eslintrc.js` contains the configuration for ESLint. ESLint is a tool to help enforce code consistency.
* `.prettierrc.js` contains the configuration for Prettier. Prettier is a tool to help format code.

Try changing some source code and see how the app changes.

## Additional Notes

* This project uses [Typescript](https://www.typescriptlang.org/).
* The linting and code formatting rules are specified in `.eslintrc.js` and `.prettierrc.js` respectively.
  You may modify the rules.
* The available scripts are in `package.json`.
  Here are some scripts that you are likely to use more often:
  * `yarn start`
  * `yarn lint:fix`
  * `yarn format:fix`

## Acknowledgements
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
This project uses [MUI](https://mui.com/), 
[TypewriterJS](https://github.com/tameemsafi/typewriterjs#readme), 
[ESLint](https://eslint.org/), [Prettier](https://prettier.io/).
