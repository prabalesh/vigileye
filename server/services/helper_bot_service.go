package services

import (
	"fmt"
	"log"
	"os"
	"strings"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type HelperBotService struct {
	bot *tgbotapi.BotAPI
}

func NewHelperBotService() (*HelperBotService, error) {
	botToken := os.Getenv("TELEGRAM_HELPER_BOT_TOKEN")
	if botToken == "" {
		return nil, fmt.Errorf("TELEGRAM_HELPER_BOT_TOKEN not set")
	}

	bot, err := tgbotapi.NewBotAPI(botToken)
	if err != nil {
		return nil, fmt.Errorf("failed to create helper bot: %w", err)
	}

	log.Printf("✅ Vigil Eye Helper Bot started: @%s", bot.Self.UserName)

	return &HelperBotService{bot: bot}, nil
}

// Start begins listening for Telegram commands (blocking)
func (s *HelperBotService) Start() {
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := s.bot.GetUpdatesChan(u)

	log.Println("📱 Helper bot listening for /chatid commands...")

	for update := range updates {
		if update.Message == nil || !update.Message.IsCommand() {
			continue
		}

		msg := tgbotapi.NewMessage(update.Message.Chat.ID, "")
		msg.ParseMode = "Markdown"

		switch update.Message.Command() {
		case "start":
			msg.Text = s.handleStart()
		case "help":
			msg.Text = s.handleHelp()
		case "chatid":
			msg.Text = s.handleChatID(update.Message.Chat)
		default:
			msg.Text = "Unknown command. Use /help to see available commands."
		}

		if _, err := s.bot.Send(msg); err != nil {
			log.Printf("[Helper Bot] Error sending message: %v", err)
		}
	}
}

func (s *HelperBotService) handleStart() string {
	return `👋 *Welcome to Vigil Eye Helper Bot!*

I help you get your Telegram chat ID for setting up error notifications in Vigil Eye.

*How to use:*
1. Add me to your Telegram group
2. Send /chatid command
3. Copy the chat ID I provide
4. Use it in Vigil Eye dashboard

Type /help for more information.`
}

func (s *HelperBotService) handleHelp() string {
	return `🔧 *Vigil Eye Helper Bot - Help*

*Available Commands:*
• /chatid - Get the chat ID of current group/channel
• /help - Show this help message
• /start - Show welcome message

*Setup Instructions:*

1️⃣ *Create your own bot* with @BotFather
   • Open Telegram, search for @BotFather
   • Send: /newbot
   • Copy your bot token

2️⃣ *Create notification group*
   • Create a new Telegram group
   • Add your team members
   • Add your bot (the one you created)

3️⃣ *Get chat ID* (this is where I help!)
   • Add me to the group
   • Send: /chatid
   • Copy the chat ID
   • You can remove me after getting the ID

4️⃣ *Configure in Vigil Eye*
   • Go to your project settings
   • Enter your bot token
   • Enter the chat ID
   • Test notification

That's it! 🚀`
}

func (s *HelperBotService) handleChatID(chat *tgbotapi.Chat) string {
	chatType := strings.Title(chat.Type)
	chatTitle := chat.Title
	if chatTitle == "" {
		chatTitle = fmt.Sprintf("%s %s", chat.FirstName, chat.LastName)
	}

	switch chat.Type {
	case "group", "supergroup":
		return fmt.Sprintf(`✅ *Chat ID Retrieved!*

*Chat Name:* %s
*Chat Type:* %s
*Chat ID:* `+"`%d`"+`

📋 *Copy the chat ID above* and paste it in your Vigil Eye dashboard.

⚠️ *Important:*
• Make sure your notification bot (not me) is also in this group
• The chat ID is negative for groups (this is normal)
• You can remove me from this group now

Need help? Type /help`, chatTitle, chatType, chat.ID)

	case "channel":
		return fmt.Sprintf(`✅ *Channel ID Retrieved!*

*Channel Name:* %s
*Chat ID:* `+"`%d`"+`

📋 *Copy the chat ID above* and paste it in your Vigil Eye dashboard.

⚠️ *Important:*
• Make sure your notification bot is added as admin to this channel
• You can remove me from this channel now`, chatTitle, chat.ID)

	case "private":
		return fmt.Sprintf(`ℹ️ *Private Chat*

Your user ID is: `+"`%d`"+`

⚠️ *Note:* For Vigil Eye notifications, you need to:
1. Create a *group* (not private chat)
2. Add me to that group
3. Send /chatid there

Private chats won't work for team notifications.

Type /help for setup instructions.`, chat.ID)

	default:
		return fmt.Sprintf(`*Chat ID:* `+"`%d`"+`
*Type:* %s`, chat.ID, chatType)
	}
}
