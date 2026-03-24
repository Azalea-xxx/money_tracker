const CATEGORIES = ['еда', 'транспорт', 'развлечения', 'связь', 'другое']

// Состояние приложения
let expenses = []
let filteredExpenses = []
let currentFilter = 'all'
let currentSort = 'date-desc'
let dragStartIndex = null

const STORAGE_KEY = 'money_tracker'

// Инициализация приложения
function init() {
	createAppStructure()
	loadFromStorage()
	setupEventListeners()
	render()
}

// Создание структуры страницы
function createAppStructure() {
	const app = document.createElement('div')
	app.className = 'app'
	document.body.appendChild(app)

	// Заголовок
	const title = document.createElement('h1')
	title.textContent = 'Money Tracker'
	app.appendChild(title)

	// Форма добавления
	const form = document.createElement('div')
	form.className = 'add-form'
	form.innerHTML = `
        <input type="text" id="nameInput" placeholder="Название" required>
        <input type="number" id="amountInput" placeholder="Сумма" required min="0">
        <select id="categorySelect">
            ${CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
        <button id="addBtn">Добавить</button>
    `
	app.appendChild(form)

	// Фильтры
	const filters = document.createElement('div')
	filters.className = 'filters'
	filters.innerHTML = `
        <select id="categoryFilter">
            <option value="all">Все категории</option>
            ${CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
        <select id="sortSelect">
            <option value="date-desc">Сначала новые</option>
            <option value="date-asc">Сначала старые</option>
            <option value="amount-desc">Сначала дорогие</option>
            <option value="amount-asc"> Сначала дешёвые</option>
        </select>
    `
	app.appendChild(filters)

	// Общая сумма
	const totalDiv = document.createElement('div')
	totalDiv.className = 'total'
	totalDiv.id = 'totalAmount'
	app.appendChild(totalDiv)

	// Список трат
	const list = document.createElement('div')
	list.className = 'expenses-list'
	list.id = 'expensesList'
	app.appendChild(list)
}

// Загрузка из localStorage
function loadFromStorage() {
	const saved = localStorage.getItem(STORAGE_KEY)
	expenses = saved ? JSON.parse(saved) : getInitialData()
	applyFilterAndSort()
}

// Начальные данные
function getInitialData() {
	return [
		{
			id: Date.now() - 86400000,
			name: 'Кофе',
			amount: 250,
			category: 'еда',
			date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
		},
		{
			id: Date.now() - 172800000,
			name: 'Такси',
			amount: 450,
			category: 'транспорт',
			date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
		},
	]
}

// Сохранение в localStorage
function saveToStorage() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
}

// Настройка обработчиков событий
function setupEventListeners() {
	document.getElementById('addBtn').addEventListener('click', addExpense)
	document.getElementById('categoryFilter').addEventListener('change', e => {
		currentFilter = e.target.value
		applyFilterAndSort()
	})
	document.getElementById('sortSelect').addEventListener('change', e => {
		currentSort = e.target.value
		applyFilterAndSort()
	})
}

// Добавление новой траты
function addExpense() {
	const nameInput = document.getElementById('nameInput')
	const amountInput = document.getElementById('amountInput')
	const categorySelect = document.getElementById('categorySelect')

	const name = nameInput.value.trim()
	const amount = parseFloat(amountInput.value)
	const category = categorySelect.value

	if (!name || !amount || amount <= 0) {
		alert('Заполните все поля корректно!')
		return
	}

	const newExpense = {
		id: Date.now(),
		name,
		amount,
		category,
		date: new Date().toISOString().split('T')[0],
	}

	expenses.push(newExpense)
	saveToStorage()
	applyFilterAndSort()

	nameInput.value = ''
	amountInput.value = ''
}

// Удаление траты
function deleteExpense(id) {
	if (confirm('Удалить запись?')) {
		expenses = expenses.filter(e => e.id !== id)
		saveToStorage()
		applyFilterAndSort()
	}
}

// Редактирование траты
function editExpense(id) {
	const expense = expenses.find(e => e.id === id)
	if (!expense) return

	const newName = prompt('Новое название:', expense.name)
	if (newName === null) return

	const newAmount = prompt('Новая сумма:', expense.amount)
	if (newAmount === null) return

	const newCategory = prompt(
		'Новая категория (еда/транспорт/развлечения/связь/другое):',
		expense.category,
	)
	if (newCategory === null) return

	if (
		newName.trim() &&
		parseFloat(newAmount) > 0 &&
		CATEGORIES.includes(newCategory)
	) {
		expense.name = newName.trim()
		expense.amount = parseFloat(newAmount)
		expense.category = newCategory
		saveToStorage()
		applyFilterAndSort()
	} else {
		alert('Некорректные данные!')
	}
}

// Применение фильтров и сортировки
function applyFilterAndSort() {
	// Фильтрация
	filteredExpenses = expenses.filter(
		e => currentFilter === 'all' || e.category === currentFilter,
	)

	// Сортировка
	filteredExpenses.sort((a, b) => {
		switch (currentSort) {
			case 'date-desc':
				return new Date(b.date) - new Date(a.date)
			case 'date-asc':
				return new Date(a.date) - new Date(b.date)
			case 'amount-desc':
				return b.amount - a.amount
			case 'amount-asc':
				return a.amount - b.amount
			default:
				return 0
		}
	})

	render()
}

// Отрисовка списка
function render() {
	const list = document.getElementById('expensesList')
	const totalDiv = document.getElementById('totalAmount')

	// Подсчёт общей суммы
	const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
	totalDiv.textContent = `Итого: ${total} ₽`

	if (filteredExpenses.length === 0) {
		list.innerHTML = '<div class="empty-state">Нет трат за этот период</div>'
		return
	}

	list.innerHTML = ''
	filteredExpenses.forEach((expense, index) => {
		const item = createExpenseItem(expense, index)
		list.appendChild(item)
	})
}

// Создание элемента траты
function createExpenseItem(expense, index) {
	const item = document.createElement('div')
	item.className = 'expense-item'
	item.draggable = true
	item.dataset.index = index
	item.dataset.id = expense.id

	item.innerHTML = `
        <span class="category ${expense.category}">${expense.category}</span>
        <span class="name">${expense.name}</span>
        <span class="amount">${expense.amount}</span>
        <div class="actions">
            <button class="btn-icon edit" onclick="editExpense(${expense.id})">✏️</button>
            <button class="btn-icon delete" onclick="deleteExpense(${expense.id})">🗑️</button>
        </div>
    `

	// Drag & Drop события
	item.addEventListener('dragstart', handleDragStart)
	item.addEventListener('dragover', handleDragOver)
	item.addEventListener('drop', handleDrop)
	item.addEventListener('dragend', handleDragEnd)

	return item
}

// Drag & Drop обработчики
function handleDragStart(e) {
	dragStartIndex = parseInt(e.target.dataset.index)
	e.target.classList.add('dragging')
	e.dataTransfer.setData('text/plain', dragStartIndex)
	e.dataTransfer.effectAllowed = 'move'
}

function handleDragOver(e) {
	e.preventDefault()
	e.dataTransfer.dropEffect = 'move'

	const item = e.target.closest('.expense-item')
	if (item) {
		item.classList.add('drag-over')
	}
}

function handleDrop(e) {
	e.preventDefault()
	const target = e.target.closest('.expense-item')
	if (!target) return

	target.classList.remove('drag-over')

	const dragEndIndex = parseInt(target.dataset.index)
	if (dragStartIndex === null || dragStartIndex === dragEndIndex) return

	// Переставляем элементы
	const [removed] = filteredExpenses.splice(dragStartIndex, 1)
	filteredExpenses.splice(dragEndIndex, 0, removed)

	// Обновляем порядок в исходном массиве
	const startId = parseInt(e.dataTransfer.getData('text/plain'))
	const endId = parseInt(target.dataset.id)

	const startExpense = expenses.find(e => e.id === startId)
	const endExpense = expenses.find(e => e.id === endId)

	const startIdx = expenses.indexOf(startExpense)
	const endIdx = expenses.indexOf(endExpense)

	if (startIdx !== -1 && endIdx !== -1) {
		const [moved] = expenses.splice(startIdx, 1)
		expenses.splice(endIdx, 0, moved)
		saveToStorage()
	}

	applyFilterAndSort()
	dragStartIndex = null
}

function handleDragEnd(e) {
	e.target.classList.remove('dragging')
	document.querySelectorAll('.expense-item').forEach(item => {
		item.classList.remove('drag-over')
	})
	dragStartIndex = null
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init)
