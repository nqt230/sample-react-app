package main

import (
    "fmt"
    "log"
    "net/http"
    "net/url"
    "database/sql"
    _ "github.com/mattn/go-sqlite3"
    "encoding/json"
    "gopkg.in/gomail.v2"
    "crypto/sha256"
    "strconv"
    "encoding/base64"
)

const baseURL = "http://localhost:8080/"
const dbPath = "./server_data.db"
const driverName = "sqlite3"
const appEmail = "taskmanagerapp230@gmail.com"
const appPass = "56482309(uU"

func handleErr(err error) {
    if err != nil {
        panic(err)
    }
}

func create_tables() {
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    // Create UserTemp table
    _, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS UserTemp (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        password BLOB,
        hash BLOB
    );
    `)
    handleErr(err)
    // Create User table
    _, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS User (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        password BLOB,
        telegram_id TEXT,
        hash BLOB
    );
    `)
    handleErr(err)
    // Create Category table
    _, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS Category (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        priority INTEGER,
        color TEXT,
        FOREIGN KEY(user_id) REFERENCES User(user_id)
    );
    `)
    handleErr(err)
    // Create Task table
    _, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS Task (
        task_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        category_id INTEGER,
        order_number INTEGER,
        name TEXT,
        description TEXT,
        due_date DATETIME,
        notify_date DATETIME,
        is_done BOOLEAN,
        FOREIGN KEY(user_id) REFERENCES User(user_id),
        FOREIGN KEY(category_id) REFERENCES Category(category_id)
    );
    `)
    handleErr(err)
    db.Close()
}

func setupResponse(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
    (*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
    (*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func checkEmailAvailHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        Email string `json:"email"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Check email availability: " + data.Email)
    // Check if email is in User
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT email FROM User WHERE email = ?`, data.Email)
    handleErr(err)
    var isTaken = "false"
    if rows.Next() {
        isTaken = "true"
    }
    rows.Close()
    db.Close()
    // Output response
    fmt.Fprintf(w, isTaken)
}

func createAccHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        Email string `json:"email"`
        Password string `json:"password"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Register account (unverified): " + data.Email)
    // Create temp account (unverified)
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    hashPw := sha256.Sum256([]byte(data.Password))
    rows, err := db.Query(`SELECT seq FROM sqlite_sequence WHERE name = ?`, "UserTemp")
    var lastID int // get last user_id inserted
    if rows.Next() {
        err = rows.Scan(&lastID)
        handleErr(err)
    } else {
        lastID = 1
    }
    rows.Close()
    hash := sha256.Sum256([]byte(strconv.Itoa(lastID))) // this hash will be used to generate an email verification link
    _, err = db.Exec(`INSERT INTO UserTemp (email, password, hash) VALUES (?, ?, ?)`, data.Email, hashPw[:], hash[:])
    handleErr(err)
    db.Close()
    // Generate email verification link
    params := url.Values{}
    params.Add("id", base64.StdEncoding.EncodeToString(hash[:]))
    params.Add("email", data.Email)
    verificationURL := baseURL+"verifyEmail?"+params.Encode()
    sendVerificationEmail(data.Email, verificationURL)
    // Output response
    fmt.Fprintf(w, "Success")
}

func sendVerificationEmail(email string, verificationURL string) {
    m := gomail.NewMessage()
    m.SetHeader("From", appEmail)
    m.SetHeader("To", email)
    m.SetHeader("Subject", "Task Management App Email Verification")
    m.SetBody(
        "text/plain",
        "Click this link to verify your email: " + verificationURL + "\n" +
        "Please ignore this email if you did not register for this app. ")
    d := gomail.NewDialer("smtp.gmail.com", 587, appEmail, appPass)
    err := d.DialAndSend(m)
    handleErr(err)
}

func verifyEmailHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    err := r.ParseForm()
    handleErr(err)
    email := r.FormValue("email")
    id := r.FormValue("id")
    if email == "" || id == "" {
        fmt.Fprintf(w, "Invalid link")
        return
    }
    hash, err := base64.StdEncoding.DecodeString(id)
    log.Println("Register account (verified): " + email)
    // Create account (verified)
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT password FROM UserTemp WHERE email = ? AND hash = ?`, email, hash)
    handleErr(err)
    var password []byte
    if rows.Next() {
        err = rows.Scan(&password)
        handleErr(err) 
    } else {
        rows.Close()
        db.Close()
        fmt.Fprintf(w, "Invalid link")
        return
    }
    rows.Close()
    _, err = db.Exec(`DELETE FROM UserTemp WHERE email = ?`, email)
    handleErr(err)
    res, err := db.Exec(`INSERT INTO User (email, password, hash) VALUES (?, ?, ?)`, email, password, hash)
    handleErr(err)
    user_id, err := res.LastInsertId()
    handleErr(err)
    _, err = db.Exec(`INSERT INTO Category (user_id, name, priority, color) VALUES (?, 'Uncategorized', 0, '#fff')`, user_id)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func loginAuthHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        Email string `json:"email"`
        Password string `json:"password"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Login: " + data.Email)
    // Check if email and password match in database
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    hashPw := sha256.Sum256([]byte(data.Password))
    rows, err := db.Query(`SELECT user_id FROM User WHERE email = ? AND password = ?`, data.Email, hashPw[:])
    handleErr(err)
    var user_id = 0
    if rows.Next() {
        rows.Scan(&user_id)
    }
    rows.Close()
    db.Close()
    // Output response
    fmt.Fprintf(w, strconv.Itoa(user_id))
}

func getTasksHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        User_id int `json:"user_id"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Get tasks")
    // Query database
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`
    SELECT task_id, category_id, order_number, name, description, due_date, notify_date, is_done FROM Task WHERE user_id = ? ORDER BY order_number`, 
    data.User_id)
    handleErr(err)
    type task struct {
        Task_id int `json:"task_id"`
        Category_id int `json:"category_id"`
        Order_number int `json:"order_number"`
        Name string `json:"name"`
        Description string `json:"description"`
        Due_date string `json:"due_date"`
        Notify_date string `json:"notify_date"`
        Is_done bool `json:"is_done"`
    }
    var tasks []task
    var task_id int
    var category_id int
    var order_number int
    var name string
    var description string
    var due_date string
    var notify_date string
    var is_done bool
    for rows.Next() {
        err = rows.Scan(&task_id, &category_id, &order_number, &name, &description, &due_date, &notify_date, &is_done)
        handleErr(err)
        t := task{
            Task_id: task_id,
            Category_id: category_id,
            Order_number: order_number,
            Name: name,
            Description: description,
            Due_date: due_date,
            Notify_date: due_date,
            Is_done: is_done,
        }
        tasks = append(tasks, t)
    }
    rows.Close()
    db.Close()
    // Output response
    encoder := json.NewEncoder(w)
    err = encoder.Encode(tasks)
    handleErr(err)
}

func createTaskHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        User_id int `json:"user_id"`
        Category_id int `json:"category_id"`
        Order_number int `json:"order_number"`
        Name string `json:"name"`
        Description string `json:"description"`
        Due_date string `json:"due_date"`
        Notify_date string `json:"notify_date"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Create task")
    // Create new task
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    _, err = db.Exec(`
    INSERT INTO Task (user_id, category_id, order_number, name, description, due_date, notify_date, is_done) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    data.User_id, data.Category_id, data.Order_number, data.Name, data.Description, data.Due_date, data.Notify_date)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func editTaskHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        Task_id int `json:"task_id"`
        User_id int `json:"user_id"`
        Category_id int `json:"category_id"`
        Order_number int `json:"order_number"`
        Name string `json:"name"`
        Description string `json:"description"`
        Due_date string `json:"due_date"`
        Notify_date string `json:"notify_date"`
        Is_done bool `json:"is_done"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Update task")
    // Update task
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    _, err = db.Exec(`
    UPDATE Task
    SET category_id = ?, order_number = ?, name = ?, description = ?, due_date = ?, notify_date = ?, is_done = ?
    WHERE user_id = ? AND task_id = ?`, 
    data.Category_id, data.Order_number, data.Name, data.Description, data.Due_date, data.Notify_date, data.Is_done, data.User_id, data.Task_id)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func deleteTaskHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        User_id int `json:"user_id"`
        Task_id int `json:"task_id"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Delete task")
    // Delete task
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    _, err = db.Exec(`DELETE FROM Task WHERE task_id = ?`, data.Task_id)
    handleErr(err)
    // Update order_number
    rows, err := db.Query(`SELECT task_id, order_number FROM Task WHERE user_id = ? ORDER BY order_number`, data.User_id)
    handleErr(err)
    var task_id int
    var order_number int
    count := 1
    wrongOrder := [][]int{}
    for rows.Next() {
        rows.Scan(&task_id, &order_number)
        if order_number != count {
            wrongOrder = append(wrongOrder, []int{count, task_id})
        }
        count++
    }
    rows.Close()
    for i := 0; i < len(wrongOrder); i++ {
        _, err := db.Exec(`UPDATE Task SET order_number = ? WHERE task_id = ?`, wrongOrder[i][0], wrongOrder[i][1])
        handleErr(err)
    }
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func getCategoriesHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        User_id int `json:"user_id"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Get categories")
    // Query database
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`
    SELECT category_id, name, priority, color FROM Category WHERE user_id = ? ORDER BY priority`, 
    data.User_id)
    handleErr(err)
    type category struct {
        Category_id int `json:"category_id"`
        Name string `json:"name"`
        Priority int `json:"priority"`
        Color string `json:"color"`
    }
    var categories []category
    var category_id int
    var name string
    var priority int
    var color string
    for rows.Next() {
        err = rows.Scan(&category_id, &name, &priority, &color)
        handleErr(err)
        c:= category{
            Category_id: category_id,
            Name: name,
            Priority: priority,
            Color: color,
        }
        categories = append(categories, c)
    }
    rows.Close()
    db.Close()
    // Output response
    encoder := json.NewEncoder(w)
    err = encoder.Encode(categories)
    handleErr(err)
}

func createCategoryHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        User_id int `json:"user_id"`
        Name string `json:"name"`
        Priority int `json:"priority"`
        Color string `json:"color"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Create category")
    // Create new category
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    _, err = db.Exec(`
    INSERT INTO Category (user_id, name, priority, color) VALUES (?, ?, ?, ?)`,
    data.User_id, data.Name, data.Priority, data.Color)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func editCategoryHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        User_id int `json:"user_id"`
        Category_id int `json:"category_id"`
        Name string `json:"name"`
        Priority int `json:"priority"`
        Color string `json:"color"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Update category")
    // Update category
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    _, err = db.Exec(`
    UPDATE Category
    SET name = ?, priority = ?, color = ?
    WHERE user_id = ? AND category_id = ?`, 
    data.Name, data.Priority, data.Color, data.User_id, data.Category_id)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func deleteCategoryHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        User_id int `json:"user_id"`
        Category_id int `json:"category_id"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Delete category")
    // Remove category from affected tasks
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT category_id FROM Category WHERE user_id = ? AND priority = 0`, data.User_id)
    var uncat_id int
    if rows.Next() {
        err = rows.Scan(&uncat_id)
        handleErr(err)
    }
    rows.Close()
    _, err = db.Exec(`UPDATE Task SET category_id = ? WHERE category_id = ?`, uncat_id, data.Category_id)
    handleErr(err)
    // Delete category
    _, err = db.Exec(`DELETE FROM Category WHERE category_id = ?`, data.Category_id)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func main() {
	create_tables()
    // Set up routes
    http.HandleFunc("/checkEmailAvail", checkEmailAvailHandler)
    http.HandleFunc("/createAcc", createAccHandler)
    http.HandleFunc("/verifyEmail", verifyEmailHandler)
    http.HandleFunc("/loginAuth", loginAuthHandler)
    http.HandleFunc("/getTasks", getTasksHandler)
    http.HandleFunc("/createTask", createTaskHandler)
    http.HandleFunc("/editTask", editTaskHandler)
    http.HandleFunc("/deleteTask", deleteTaskHandler)
    http.HandleFunc("/getCategories", getCategoriesHandler)
    http.HandleFunc("/createCategory", createCategoryHandler)
    http.HandleFunc("/editCategory", editCategoryHandler)
    http.HandleFunc("/deleteCategory", deleteCategoryHandler)
    // Start server
    fmt.Println("Starting server at port 8080")
    err := http.ListenAndServe(":8080", nil)
    handleErr(err)
    
}