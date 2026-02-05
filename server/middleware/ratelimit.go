package middleware

import (
	"net/http"
	"sync"

	"golang.org/x/time/rate"
)

var (
	ips   = make(map[string]*rate.Limiter)
	mutex sync.Mutex
)

func getLimiter(ip string) *rate.Limiter {
	mutex.Lock()
	defer mutex.Unlock()

	limiter, ok := ips[ip]
	if !ok {
		limiter = rate.NewLimiter(rate.Limit(100.0/60.0), 100) // 100 requests per minute
		ips[ip] = limiter
	}

	return limiter
}

func RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		limiter := getLimiter(ip)
		if !limiter.Allow() {
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
