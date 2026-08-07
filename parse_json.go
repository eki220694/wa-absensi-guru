package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

type Teacher struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Subject   string `json:"subject"`
	TelegramID string `json:"telegram_id,omitempty"`
}

type Attendance struct {
	TeacherID string `json:"teacher_id"`
	Date      string `json:"date"`
	Status    string `json:"status"` // "hadir", "izin", "sakit", "alpa"
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func main() {
	// 1. Parse JSON string to struct
	jsonStr := `{"id":"G20240001","name":"Budi Santoso","subject":"Matematika","telegram_id":"123456789"}`
	var t Teacher
	if err := json.Unmarshal([]byte(jsonStr), &t); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Parsed: %+v\n", t)

	// 2. Parse JSON file
	data, err := os.ReadFile("data.json")
	if err != nil {
		log.Printf("File read error (expected if file missing): %v", err)
	} else {
		var teachers []Teacher
		if err := json.Unmarshal(data, &teachers); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Loaded %d teachers from file\n", len(teachers))
	}

	// 3. Parse array of objects
	arrJSON := `[
		{"teacher_id":"G20240001","date":"2026-01-15","status":"hadir","latitude":-1.23,"longitude":119.45},
		{"teacher_id":"G20240002","date":"2026-01-15","status":"izin","latitude":-1.24,"longitude":119.46}
	]`
	var attendances []Attendance
	if err := json.Unmarshal([]byte(arrJSON), &attendances); err != nil {
		log.Fatal(err)
	}
	for _, a := range attendances {
		fmt.Printf("%s: %s (%s)\n", a.TeacherID, a.Date, a.Status)
	}

	// 4. Marshal struct to JSON (pretty)
	out, _ := json.MarshalIndent(t, "", "  ")
	fmt.Println("\nOutput JSON:")
	fmt.Println(string(out))

	// 5. Stream decode for large JSON (memory efficient)
	streamJSON := `{"id":"G1","name":"A"}\n{"id":"G2","name":"B"}`
	dec := json.NewDecoder(bytes.NewReader([]byte(streamJSON)))
	for dec.More() {
		var t Teacher
		if err := dec.Decode(&t); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Stream: %s\n", t.Name)
	}
}