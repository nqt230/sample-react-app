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
    "time"
    "github.com/go-co-op/gocron"
    tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

const baseURL = "http://localhost:8080/"
const dbPath = "./server_data.db"
const driverName = "sqlite3"
const appEmail = "taskmanagerapp230@gmail.com"
const appPass = "56482309(uU"
const telebotToken = "5188994370:AAGGZnkL6r4p0Z5UBxTqmR-ccgp2FnImlyc"

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
        is_done BOOLEAN,
        FOREIGN KEY(user_id) REFERENCES User(user_id),
        FOREIGN KEY(category_id) REFERENCES Category(category_id)
    );
    `)
    handleErr(err)
    // Create Notification table
    _, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS Notification (
        notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        task_id INTEGER,
        notify_date DATETIME,
        email_notify BOOLEAN,
        telegram_notify BOOLEAN,
        FOREIGN KEY(user_id) REFERENCES User(user_id),
        FOREIGN KEY(task_id) REFERENCES Task(task_id)
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
    var nextID int // get next user_id
    if rows.Next() {
        err = rows.Scan(&nextID)
        handleErr(err)
        nextID += 1
    } else {
        nextID = 1
    }
    rows.Close()
    hash := sha256.Sum256([]byte(strconv.Itoa(nextID))) // this hash will be used to generate an email verification link
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
    _, err = db.Exec(`INSERT INTO Category (user_id, name, priority, color) VALUES (?, 'Uncategorized', 0, '#FFFFFF')`, user_id)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success: Account created")
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

func updatePasswordHandler(w http.ResponseWriter, r *http.Request) {
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
        Password string `json:"password"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Update password")
    // Update password
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    hashPw := sha256.Sum256([]byte(data.Password))
    _, err = db.Exec(`UPDATE User SET password = ? WHERE user_id = ?`, hashPw[:], data.User_id)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func updateEmailHandler(w http.ResponseWriter, r *http.Request) {
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
        Email string `json:"email"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Update email (unverified)")
    // Update email (unverified)
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT password, hash FROM User WHERE user_id = ?`, data.User_id)
    var hashPw []byte
    var hash []byte
    if rows.Next() {
        err = rows.Scan(&hashPw, &hash)
        handleErr(err)
    }
    rows.Close()
    _, err = db.Exec(`INSERT INTO UserTemp (email, password, hash) VALUES (?, ?, ?)`, data.Email, hashPw[:], hash[:])
    handleErr(err)
    db.Close()
    // Generate email verification link
    params := url.Values{}
    params.Add("id", base64.StdEncoding.EncodeToString(hash[:]))
    params.Add("email", data.Email)
    verificationURL := baseURL+"verifyUpdateEmail?"+params.Encode()
    sendVerificationEmail(data.Email, verificationURL)
    // Output response
    fmt.Fprintf(w, "Success")
}

func verifyUpdateEmailHandler(w http.ResponseWriter, r *http.Request) {
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
    log.Println("Update email (verified)")
    // Update email (verified)
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT * FROM UserTemp WHERE email = ? AND hash = ?`, email, hash)
    handleErr(err)
    if rows.Next() {
    } else {
        rows.Close()
        db.Close()
        fmt.Fprintf(w, "Invalid link")
        return
    }
    rows.Close()
    _, err = db.Exec(`DELETE FROM UserTemp WHERE email = ?`, email)
    handleErr(err)
    _, err = db.Exec(`UPDATE User SET email = ? WHERE hash = ?`, email, hash)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success: Email changed")
}

func getEmailHandler(w http.ResponseWriter, r *http.Request) {
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
    log.Println("Get email")
    // Query database
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT email FROM User WHERE user_id = ?`, data.User_id)
    handleErr(err)
    var email string
    if rows.Next() {
        err = rows.Scan(&email)
        handleErr(err)
    }
    rows.Close()
    db.Close()
    // Output response
    fmt.Fprintf(w, email)
}

func getTelegramIDHandler(w http.ResponseWriter, r *http.Request) {
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
    log.Println("Get telegram_id")
    // Query database
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT telegram_id FROM User WHERE user_id = ?`, data.User_id)
    handleErr(err)
    var telegram_id string
    if rows.Next() {
        var temp_telegram_id sql.NullString
        err = rows.Scan(&temp_telegram_id)
        handleErr(err)
        if temp_telegram_id.Valid {
            telegram_id = temp_telegram_id.String
        } else {
            telegram_id = ""
        }
    }
    rows.Close()
    db.Close()
    // Output response
    fmt.Fprintf(w, telegram_id)
}

func updateTelegramIDHandler(w http.ResponseWriter, r *http.Request, bot *tgbotapi.BotAPI) {
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
        Telegram_id string `json:"telegram_id"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Update telegram_id (unverified)")
    // Update telegram_id (unverified)
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT hash FROM User WHERE user_id = ?`, data.User_id)
    var hash []byte
    if rows.Next() {
        err = rows.Scan(&hash)
        handleErr(err)
    }
    rows.Close()
    handleErr(err)
    db.Close()
    // Generate verification link
    params := url.Values{}
    params.Add("id", base64.StdEncoding.EncodeToString(hash[:]))
    params.Add("telegram_id", data.Telegram_id)
    verificationURL := baseURL+"verifyUpdateTelegramID?"+params.Encode()
    id, err := strconv.ParseInt(data.Telegram_id, 10, 64)
    handleErr(err)
    msg := tgbotapi.NewMessage(
        id,
        "Use this link to verify your telegram_id: \n" +
        verificationURL + "\n" +
        "Please ignore this message if you did not register for this app. ")
    _, err = bot.Send(msg)
    handleErr(err)
    // Output response
    fmt.Fprintf(w, "Success")
}

func verifyUpdateTelegramIDHandler(w http.ResponseWriter, r *http.Request) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    err := r.ParseForm()
    handleErr(err)
    telegram_id := r.FormValue("telegram_id")
    id := r.FormValue("id")
    if telegram_id == "" || id == "" {
        fmt.Fprintf(w, "Invalid link")
        return
    }
    hash, err := base64.StdEncoding.DecodeString(id)
    log.Println("Update telegram_id (verified)")
    // Update telegram_id (verified)
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT * FROM User WHERE hash = ?`, hash)
    handleErr(err)
    if rows.Next() {
    } else {
        rows.Close()
        db.Close()
        fmt.Fprintf(w, "Invalid link")
        return
    }
    rows.Close()
    _, err = db.Exec(`UPDATE User SET telegram_id = ? WHERE hash = ?`, telegram_id, hash)
    handleErr(err)
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success: Telegram_id changed")
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
    SELECT task_id, category_id, order_number, name, description, due_date, is_done FROM Task WHERE user_id = ? ORDER BY order_number`, 
    data.User_id)
    handleErr(err)
    type task struct {
        Task_id int `json:"task_id"`
        Category_id int `json:"category_id"`
        Order_number int `json:"order_number"`
        Name string `json:"name"`
        Description string `json:"description"`
        Due_date string `json:"due_date"`
        Is_done bool `json:"is_done"`
    }
    var tasks []task
    var task_id int
    var category_id int
    var order_number int
    var name string
    var description string
    var due_date string
    var is_done bool
    for rows.Next() {
        err = rows.Scan(&task_id, &category_id, &order_number, &name, &description, &due_date, &is_done)
        handleErr(err)
        t := task{
            Task_id: task_id,
            Category_id: category_id,
            Order_number: order_number,
            Name: name,
            Description: description,
            Due_date: due_date,
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
    INSERT INTO Task (user_id, category_id, order_number, name, description, due_date, is_done) VALUES (?, ?, ?, ?, ?, ?, 0)`,
    data.User_id, data.Category_id, data.Order_number, data.Name, data.Description, data.Due_date)
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
    SET category_id = ?, order_number = ?, name = ?, description = ?, due_date = ?, is_done = ?
    WHERE user_id = ? AND task_id = ?`, 
    data.Category_id, data.Order_number, data.Name, data.Description, data.Due_date, data.Is_done, data.User_id, data.Task_id)
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

func getNotificationsHandler(w http.ResponseWriter, r *http.Request) {
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
    log.Println("Get notifications")
    // Query database
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`
    SELECT notification_id, notify_date, email_notify, telegram_notify FROM Notification WHERE user_id = ? AND task_id = ?`, 
    data.User_id, data.Task_id)
    handleErr(err)
    type notification struct {
        Notification_id int `json:"notification_id"`
        Notify_date string `json:"notify_date"`
        Email_notify bool `json:"email_notify"`
        Telegram_notify bool `json:"telegram_notify"`
    }
    var notifications []notification
    var notification_id int
    var notify_date string
    var email_notify bool
    var telegram_notify bool
    for rows.Next() {
        err = rows.Scan(&notification_id, &notify_date, &email_notify, &telegram_notify)
        handleErr(err)
        n:= notification{
            Notification_id: notification_id,
            Notify_date: notify_date,
            Email_notify: email_notify,
            Telegram_notify: telegram_notify,
        }
        notifications = append(notifications, n)
    }
    rows.Close()
    db.Close()
    // Output response
    encoder := json.NewEncoder(w)
    err = encoder.Encode(notifications)
    handleErr(err)
}

func createNotificationHandler(w http.ResponseWriter, r *http.Request, s *gocron.Scheduler, bot *tgbotapi.BotAPI) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        Notify_date string `json:"notify_date"`
        Email_notify bool `json:"email_notify"`
        Telegram_notify bool `json:"telegram_notify"`
        User_id int `json:"user_id"`
        Task_id int `json:"task_id"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Create notification")
    // Create new notification
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    _, err = db.Exec(`
    INSERT INTO Notification (notify_date, email_notify, telegram_notify, user_id, task_id) VALUES (?, ?, ?, ?, ?)`,
    data.Notify_date, data.Email_notify, data.Telegram_notify, data.User_id, data.Task_id)
    handleErr(err)
    rows, err := db.Query(`SELECT seq FROM sqlite_sequence WHERE name = ?`, "Notification")
    var lastID int // get last notification_id inserted
    if rows.Next() {
        err = rows.Scan(&lastID)
        handleErr(err)
    } else {
        lastID = 0
    }
    t, err := time.Parse(time.RFC3339, data.Notify_date)
    handleErr(err)
    job, err := s.Every(1).Hour().StartAt(t).LimitRunsTo(1).Do(sendNotification, lastID, bot)
    handleErr(err)
    job.Tag(strconv.Itoa(lastID))
    rows.Close()
    db.Close()
    // Output response
    fmt.Fprintf(w, strconv.Itoa(lastID))
}

func editNotificationHandler(w http.ResponseWriter, r *http.Request, s *gocron.Scheduler, bot *tgbotapi.BotAPI) {
    // Setup Cors
    setupResponse(&w)
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    // Get request data
    decoder := json.NewDecoder(r.Body)
    type rData struct {
        Notification_id int `json:"notification_id"`
        Notify_date string `json:"notify_date"`
        Email_notify bool `json:"email_notify"`
        Telegram_notify bool `json:"telegram_notify"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Update notification")
    // Update category
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    _, err = db.Exec(`
    UPDATE Notification
    SET notify_date = ?, email_notify = ?, telegram_notify = ?
    WHERE notification_id = ?`, 
    data.Notify_date, data.Email_notify, data.Telegram_notify, data.Notification_id)
    handleErr(err)
    err = s.RemoveByTag(strconv.Itoa(data.Notification_id))
    if err == nil {
        t, err := time.Parse(time.RFC3339, data.Notify_date)
        handleErr(err)
        job, err := s.Every(1).Hour().StartAt(t).LimitRunsTo(1).Do(sendNotification, data.Notification_id, bot)
        handleErr(err)
        job.Tag(strconv.Itoa(data.Notification_id))
    }
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func deleteNotificationHandler(w http.ResponseWriter, r *http.Request, s *gocron.Scheduler) {
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
        Notification_id int `json:"notification_id"`
    }
    var data rData
    err := decoder.Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Println("Delete notification")
    // Delete notification
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    _, err = db.Exec(`DELETE FROM Notification WHERE user_id = ? AND notification_id = ?`, data.User_id, data.Notification_id)
    handleErr(err)
    s.RemoveByTag(strconv.Itoa(data.Notification_id))
    db.Close()
    // Output response
    fmt.Fprintf(w, "Success")
}

func sendNotification(notification_id int, bot *tgbotapi.BotAPI) {
    log.Println("Send notification")
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    // Query Notification
    rows, err := db.Query(`
    SELECT user_id, task_id, email_notify, telegram_notify FROM Notification WHERE notification_id = ?`, 
    notification_id)
    handleErr(err)
    var user_id int
    var task_id int
    var email_notify bool
    var telegram_notify bool
    if rows.Next() {
        err = rows.Scan(&user_id, &task_id, &email_notify, &telegram_notify)
        handleErr(err)
    }
    rows.Close()
    // Query User
    rows, err = db.Query(`SELECT email, telegram_id FROM User WHERE user_id = ?`, user_id)
    handleErr(err)
    var email string
    var telegram_id string
    if rows.Next() {
        var temp_telegram_id sql.NullString
        err = rows.Scan(&email, &temp_telegram_id)
        handleErr(err)
        if temp_telegram_id.Valid {
            telegram_id = temp_telegram_id.String
        } else {
            telegram_id = ""
        }
    }
    rows.Close()
    // Query Task
    rows, err = db.Query(`SELECT name, description, due_date, category_id FROM Task WHERE task_id = ?`, task_id)
    handleErr(err)
    var task_name string
    var description string
    var due_date string
    var category_id int
    if rows.Next() {
        err = rows.Scan(&task_name, &description, &due_date, &category_id)
        handleErr(err)
    }
    rows.Close()
    if description == "" {
        description = "No description"
    }
    // Query Category
    rows, err = db.Query(`SELECT name FROM Category WHERE category_id = ?`, category_id)
    handleErr(err)
    var category_name string
    if rows.Next() {
        err = rows.Scan(&category_name)
        handleErr(err)
    }
    rows.Close()
    // Send Notification
    t, err := time.Parse(time.RFC3339, due_date)
    t = t.Local()
    due_date = fmt.Sprintf("%s %d/%d/%d, %d:%d", t.Weekday().String(), t.Day(), t.Month(), t.Year(), t.Hour(), t.Minute())
    if email_notify {
        m := gomail.NewMessage()
        m.SetHeader("From", appEmail)
        m.SetHeader("To", email)
        m.SetHeader("Subject", "Task Management App Scheduled Notification")
        m.SetBody(
            "text/plain",
            "Reminder that task '" + task_name + "' is due on " + due_date + ".\n" +
            "Task description:\n" +
            description + "\n" +
            "Category:\n" +
            category_name + "\n" +
            "Please ignore this email if you did not register for this app. ")
        d := gomail.NewDialer("smtp.gmail.com", 587, appEmail, appPass)
        err = d.DialAndSend(m)
        handleErr(err)
    }
    if telegram_notify && telegram_id != "" {
        id, err := strconv.ParseInt(telegram_id, 10, 64)
        handleErr(err)
        msg := tgbotapi.NewMessage(
            id,
            "Reminder that task '" + task_name + "' is due on " + due_date + ".\n" +
            "Task description:\n" +
            description + "\n" +
            "Category:\n" +
            category_name + "\n" +
            "Please ignore this message if you did not register for this app. ")
        _, err = bot.Send(msg)
        handleErr(err)
    }
    // Delete notification
    _, err = db.Exec(`DELETE FROM Notification WHERE notification_id = ?`, notification_id)
    handleErr(err)
    db.Close()
}

func initSchedulerAndBot() (*gocron.Scheduler, *tgbotapi.BotAPI) {
    s := gocron.NewScheduler(time.UTC)
    bot, err := tgbotapi.NewBotAPI(telebotToken)
    handleErr(err)
    _, err = s.Every(5).Second().LimitRunsTo(1).Do(handleTelegramUpdates, bot, s, 0)
    handleErr(err)
    db, err := sql.Open(driverName, dbPath)
    handleErr(err)
    rows, err := db.Query(`SELECT notification_id, notify_date FROM Notification`)
    handleErr(err)
    var notification_id int
    var notify_date string
    for rows.Next() {
        err = rows.Scan(&notification_id, &notify_date)
        handleErr(err)
        t, err := time.Parse(time.RFC3339, notify_date)
        handleErr(err)
        job, err := s.Every(1).Hour().StartAt(t).LimitRunsTo(1).Do(sendNotification, notification_id)
        handleErr(err)
        job.Tag(strconv.Itoa(notification_id))
    }
    rows.Close()
    db.Close()
    s.StartAsync()
    return s, bot
}

func handleTelegramUpdates(bot *tgbotapi.BotAPI, s *gocron.Scheduler, offset int) {
    updateConfig := tgbotapi.NewUpdate(offset)
    updateConfig.Timeout = 30
    updates, err := bot.GetUpdates(updateConfig)
    handleErr(err)
    var max = -1;
    for i := range updates {
        update := updates[i]
        if update.UpdateID > max {
            max = update.UpdateID
        }
        if update.Message != nil {
            if update.Message.IsCommand() {
                msg := tgbotapi.NewMessage(update.Message.Chat.ID, "")
                switch update.Message.Command() {
                case "start":
                    msg.Text = "Hello! Scheduled notifications of the task management app " + 
                        "will be sent through here if your telegram_id is registered with an account. " + 
                        "Use /help to see available commands. "
                case "help":
                    msg.Text = "Available commands:\n/getID to get your telegram_id (different from your telegram handle)"
                case "getID":
                    msg.Text = fmt.Sprintf("Your telegram_id is: %v", update.Message.Chat.ID)
                default:
                    msg.Text = "I don't know that command"
                }
                _, err = bot.Send(msg)
                handleErr(err)
            }
        }
    }
    _, err = s.Every(5).Second().LimitRunsTo(1).Do(handleTelegramUpdates, bot, s, max + 1)
    handleErr(err)
}

func main() {
    // Set up tables
	create_tables()
    // Start scheduler
    s, bot := initSchedulerAndBot()
    // Set up routes
    http.HandleFunc("/checkEmailAvail", checkEmailAvailHandler)
    http.HandleFunc("/createAcc", createAccHandler)
    http.HandleFunc("/verifyEmail", verifyEmailHandler)
    http.HandleFunc("/loginAuth", loginAuthHandler)
    http.HandleFunc("/updatePassword", updatePasswordHandler)
    http.HandleFunc("/updateEmail", updateEmailHandler)
    http.HandleFunc("/verifyUpdateEmail", verifyUpdateEmailHandler)
    http.HandleFunc("/getEmail", getEmailHandler)
    http.HandleFunc("/getTelegramID", getTelegramIDHandler)
    http.HandleFunc("/updateTelegramID", func(w http.ResponseWriter, r *http.Request){ updateTelegramIDHandler(w, r, bot) })
    http.HandleFunc("/verifyUpdateTelegramID", verifyUpdateTelegramIDHandler)
    http.HandleFunc("/getTasks", getTasksHandler)
    http.HandleFunc("/createTask", createTaskHandler)
    http.HandleFunc("/editTask", editTaskHandler)
    http.HandleFunc("/deleteTask", deleteTaskHandler)
    http.HandleFunc("/getCategories", getCategoriesHandler)
    http.HandleFunc("/createCategory", createCategoryHandler)
    http.HandleFunc("/editCategory", editCategoryHandler)
    http.HandleFunc("/deleteCategory", deleteCategoryHandler)
    http.HandleFunc("/getNotifications", getNotificationsHandler)
    http.HandleFunc("/createNotification", func(w http.ResponseWriter, r *http.Request){ createNotificationHandler(w, r, s, bot) })
    http.HandleFunc("/editNotification", func(w http.ResponseWriter, r *http.Request){ editNotificationHandler(w, r, s, bot) })
    http.HandleFunc("/deleteNotification", func(w http.ResponseWriter, r *http.Request){ deleteNotificationHandler(w, r, s) })
    // Start server
    fmt.Println("Starting server at port 8080")
    err := http.ListenAndServe(":8080", nil)
    handleErr(err)
}