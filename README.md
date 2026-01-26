# Direct Cash Group - Playwright Automation

# If you want to run this automation locally for the fist time:
1.- Make sure you are inside the "DirectCashGroupAutomation" folder
2.- Command to install deps: 
npm install 
or 
npm ci 
3.- Command to install browsers : npx playwright install  
(for Linux: npx playwright install --with-deps) 
4.- Create a .env file at the same folder level of this readme file
5.- Ask for the .env variables and paste them in the .env file

# Command to run all tests locally: 
npx playwright test
# Command to run a single folfer or file
npx playwright test folderName/Filename
# Command to see the results report: 
npx playwright show-report
# Command to debug step by step:
npx playwright test --debug
# Command to run with UI:
npx playwright test --ui
# Command to run with headed mode:
npx playwright test --headed

