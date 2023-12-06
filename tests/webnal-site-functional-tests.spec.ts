import {test, expect} from '@playwright/test';
import {text} from "node:stream/consumers";

test.beforeEach(async ({ page }) => {
    await page.goto('https://iwebnal.github.io/qasandbox/');
});

test.describe('Тесты переключения видимости картинки', () => {
    test('При нажатии на кнопку "Click" должен переключать видимость картинки', async ({page}) => {

        // arrange
        const buttonClick = page.getByRole('button', {name: 'Click'})
        const divImgBox = page.locator("#img-box")

        // act
        // скрываем картинку
        await buttonClick.click()

        // assert
        expect(await divImgBox.isVisible()).toBeFalsy()

        // показываем картинку
        await buttonClick.click()

        expect(await divImgBox.isVisible()).toBeTruthy()
    })
})

test.describe('Тесты создания пользовател', () => {
    test('Ограничение на количество символов в поле ввода Логина и Пароля отсутствует', async ({page}) => {

        // arrange
        const text = "aaabbbdddccc"

        const inputs = [
            text,

            // medium
            text.repeat(10),

            // large
            text.repeat(30),

            // very large
            text.repeat(60),

            // extra large
            text.repeat(500)
            ]

        const inputLogin = page.locator("#login")
        const inputPass = page.locator("#pass")

        // act
        for (const input of inputs) {

            await inputLogin.fill(input)
            await inputPass.fill(input)

            const loginValue = await inputLogin.inputValue()
            const passwordValue = await inputPass.inputValue()

            // assert
            // проверяем, что длина значения поля равна длине входных данных
            expect(loginValue.length).toEqual(input.length)
            expect(passwordValue.length).toEqual(input.length)
        }

    })

    test('При заполнении только поля "Login", отображается сообщение "Обязательное поле "Password" не заполнено"', async ({page}) => {
        
        // arrange
        const expectedText = 'Обязательное поле "Password" не заполнено'
        const inputLogin = page.locator("#login")
        const createButton = page.getByRole('button', {name: 'Создать'})

        
        // act
        await inputLogin.fill("testLogin")
        await createButton.click()

        const errorText = await page.locator("#demo").textContent()
        
        // assert
        expect(errorText).toEqual(expectedText)
    })

    test('При заполнении только поля "Password", отображается сообщение "Обязательное поле "Login" не заполнено"', async ({page}) => {

        // arrange
        const expectedText = 'Обязательное поле "Login" не заполнено'
        const inputPassword = page.locator("#pass")
        const createButton = page.getByRole('button', {name: 'Создать'})


        // act
        await inputPassword.fill("testPassword")
        await createButton.click()

        const errorText = await page.locator("#demo").textContent()

        // assert
        expect(errorText).toEqual(expectedText)
    })

    test('При заполнении обоих полей формы "Создать пользователя" и нажатии кнопки "Создать" отображается сообщение ' +
        '"Обязательные поля "Login" и "Password" заполнены корректно. Запрос отправлен! ' +
        'Через 5 секунд получим ответ с сервера"', async ({page}) => {

        // arrange
        const expectedText = 'Обязательные поля "Login" и "Password" заполнены корректно. Запрос отправлен!Через 5 секунд получим ответ с сервера'
        const inputLogin = page.locator("#login")
        const inputPassword = page.locator("#pass")
        const createButton = page.getByRole('button', {name: 'Создать'})


        // act
        await inputLogin.fill("testLogin")
        await inputPassword.fill("testPassword")
        await createButton.click()

        const message = await page.locator("#demo").textContent()

        // assert
        expect(message).toEqual(expectedText)
    })
})

test.describe('Тесты local storage', () => {
    test('При нажатии на кнопку "Добавить данные" - данные (name=John Smith, age=30, role=Administrator) добавляются в Local Storage',
        async({page}) => {

        // arrange
        const name = "John Smith"
        const age = 30
        const role = "Administrator"

        // act
        const addDataButton = page.getByRole('button', {name: 'Добавить данные'})
        await addDataButton.click()

        const addedName = await page.evaluate(() => localStorage.getItem("name"))
        const addedAge = await page.evaluate(() => localStorage.getItem("age"))
        const addedRole = await page.evaluate(() => localStorage.getItem("role"))

        // assert
        expect(name).toEqual(addedName)
        expect(age).toEqual(parseInt(addedAge))
        expect(role).toEqual(addedRole)
    })
    test('При нажатии на кнопку "Показать данные" - на странице отображается информация с данными из Local Storage.',
        async({page}) => {

        // arrange
        const name = "John Smith"
        const age = 30
        const role = "Administrator"

        // act
        const addDataButton = page.getByRole('button', {name: 'Добавить данные'})
        const showDataButton = page.getByRole('button', {name: 'Показать данные'})

        await addDataButton.click()
        await showDataButton.click()
        
        // assert
        const nameText = await page.locator("#name").textContent()
        const ageText = await page.locator("#age").textContent()
        const roleText = await page.locator("#role").textContent()

        //assert
        expect(nameText).toEqual(name)
        expect(ageText).toEqual(age.toString())
        expect(roleText).toEqual(role)

    })

    test('При нажатии на кнопку "Удалить данные" - данные из Local Storage удаляются',
        async({page}) => {
        // act
        // Добавляем тестовые данные в local storage
        const addDataButton = page.getByRole('button', {name: 'Добавить данные'})
        await addDataButton.click()

        const clearDataButton = page.getByRole('button', {name: 'Удалить данные'})

        // Проверяем, что local storage не пустой
        let isLocalStorageEmpty = await page.evaluate(() => localStorage.length) == 0
        expect(isLocalStorageEmpty).toBeFalsy()

        await clearDataButton.click()

        // assert
        isLocalStorageEmpty = await page.evaluate(() => localStorage.length) == 0
        expect(isLocalStorageEmpty).toBeTruthy()
    })
})

test.describe('Тесты генерации ошибок в Console', () => {
    test('При нажатии кнопки "Показать ошибку" - во вкладке Console отображается ошибка с текстом "Нет доступа к серверу!".', async({page}) => {

        // arrange
        let consoleError: string | null = null;
        page.on('pageerror', error => {
           consoleError = error.message
        });

        // act
        const showErrorButton = page.getByRole('button', {name: 'Показать ошибку'})
        await showErrorButton.click()

        // assert
        expect(consoleError).toBe('Нет доступа к серверу!');
    })
})