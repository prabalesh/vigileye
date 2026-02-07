package models

type TelegramNotification struct {
	Enabled  bool                 `json:"enabled"`
	BotToken string               `json:"bot_token"`
	ChatID   string               `json:"chat_id"`
	Triggers NotificationTriggers `json:"triggers"`
}

type NotificationTriggers struct {
	NewError       bool             `json:"new_error"`
	Threshold      ThresholdTrigger `json:"threshold"`
	SpikeOnIgnored bool             `json:"spike_on_ignored"`
}

type ThresholdTrigger struct {
	Enabled       bool `json:"enabled"`
	Count         int  `json:"count"`
	WindowMinutes int  `json:"window_minutes"`
}

type NotificationSettings struct {
	Telegram TelegramNotification `json:"telegram"`
}
