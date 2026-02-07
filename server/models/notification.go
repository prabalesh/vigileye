package models

import "encoding/json"

type NotificationSettings struct {
	Telegram TelegramNotification `json:"telegram"`
}

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
	Enabled       bool        `json:"enabled"`
	Count         json.Number `json:"count"`
	WindowMinutes json.Number `json:"window_minutes"`
}

func (t ThresholdTrigger) GetCount() int {
	if t.Count == "" {
		return 0
	}
	v, _ := t.Count.Int64()
	return int(v)
}

func (t ThresholdTrigger) GetWindowMinutes() int {
	if t.WindowMinutes == "" {
		return 0
	}
	v, _ := t.WindowMinutes.Int64()
	return int(v)
}
