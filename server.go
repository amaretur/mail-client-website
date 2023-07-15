package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
)

func main() {

	// Работа с аргументами командной строки
	var port, dir, path string

	flag.StringVar(&port, "port", "8000", "Port number")
	flag.StringVar(&dir, "dir", "./static", "Path to the directory with static")
	flag.StringVar(&path, "path", "/", "The url where the static will be available")

	flag.Parse()

	// Настроиваем роутер
	http.Handle(path, http.FileServer(http.Dir(dir)))

	// Запуск сервера
	go func() {
		err := http.ListenAndServe(":" + port, nil)
		if err != nil {
			fmt.Println(err.Error())
		}
	} ()

	fmt.Printf("Server is running on %s port!\n", port)
	fmt.Printf("press CTRL+C for shutdown...\n\n")

	// Ожидание сигнала CTRL+C для завершения
	exit := make(chan os.Signal, 1)
	signal.Notify(exit, os.Interrupt)
	<-exit

	fmt.Printf("\nbye!\n")
	
}