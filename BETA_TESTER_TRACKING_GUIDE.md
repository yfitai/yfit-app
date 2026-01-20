# YFIT Beta Tester Tracking Guide

**Purpose:** Track your 12+ beta testers through the entire Google Play closed testing process

**Files:**
- `BETA_TESTER_TRACKING.csv` - Main tracking spreadsheet
- This guide - Instructions for using the spreadsheet

---

## 📊 **Spreadsheet Columns Explained**

### **Column 1: Tester #**
- Pre-filled 1-20 (aim for 12+, but have backups)
- Helps you track progress toward the 12-tester goal

### **Column 2: Name**
- First name or full name of the tester
- Example: "John", "Sarah Smith"

### **Column 3: Relationship**
- How you know them
- Examples: "Brother", "Friend", "Coworker", "Reddit user", "Gym buddy"
- Helps you remember who to follow up with

### **Column 4: Gmail Address**
- **REQUIRED** - This is what you'll add to Google Play Console
- Must be a Gmail address (Google requirement)
- Example: "john.smith@gmail.com"

### **Column 5: Date Contacted**
- When you sent them the recruitment message
- Format: YYYY-MM-DD (e.g., 2026-01-20)
- Helps you track who needs follow-up

### **Column 6: Response Status**
- Track their response to your request
- Options:
  - **Not Contacted** - Haven't reached out yet
  - **Awaiting Response** - Sent message, waiting for reply
  - **Agreed** - Said yes, waiting for Gmail address
  - **Declined** - Said no
  - **No Response** - Didn't reply after 3+ days
  - **Gmail Received** - Ready to add to Play Console

### **Column 7: Date Added to Play Console**
- When you added their email to Google Play Console closed testing
- Format: YYYY-MM-DD
- Leave blank until you actually add them

### **Column 8: Opt-In Status**
- Whether they've opted into the beta
- Options:
  - **Not Invited** - Haven't added to Play Console yet
  - **Invited** - Added to Play Console, Google sent them email
  - **Opted In** - They clicked the opt-in link
  - **Installed** - They downloaded and installed the app
  - **Active** - They're actively using the app
  - **Inactive** - Haven't used it in 3+ days

### **Column 9: Date Opted In**
- When they clicked the Google opt-in link
- Format: YYYY-MM-DD
- **Important:** 14-day testing period starts when you have 12+ people opted in

### **Column 10: Last Active**
- Last time they used the app (check in Supabase or analytics)
- Format: YYYY-MM-DD
- Helps you identify who needs a reminder

### **Column 11: Notes**
- Any additional information
- Examples:
  - "Very active, great feedback"
  - "Needs reminder to opt in"
  - "Said they'd test on weekends only"
  - "Referred by Sarah"

### **Column 12: Lifetime Pro Access Granted**
- Track if you've given them lifetime Pro access as promised
- Options: **Yes** / **No**
- **Important:** Remember to grant this after the 14-day test!

---

## 🎯 **How to Use This Spreadsheet**

### **Phase 1: Recruitment (Days 1-3)**

1. **Make a list of 15-20 potential testers**
   - Fill in Columns 2-3 (Name, Relationship)
   - Aim for more than 12 in case some decline

2. **Send recruitment messages**
   - Use templates from `BETA_TESTER_RECRUITMENT.md`
   - Fill in Column 5 (Date Contacted)
   - Update Column 6 to "Awaiting Response"

3. **Track responses**
   - When they reply "yes" → Update Column 6 to "Agreed"
   - When they send Gmail → Add to Column 4, update Column 6 to "Gmail Received"
   - When they decline → Update Column 6 to "Declined"

4. **Follow up after 2 days**
   - Anyone still "Awaiting Response" → Send follow-up message
   - After 3 days with no response → Update to "No Response"

### **Phase 2: Adding to Play Console (Day 3-4)**

1. **Once you have 12+ Gmail addresses:**
   - Go to Google Play Console
   - Navigate to: **Testing** → **Closed testing** → **Testers** tab
   - Click **Create email list** or add to existing list
   - Paste all Gmail addresses

2. **Update spreadsheet:**
   - Fill in Column 7 (Date Added to Play Console)
   - Update Column 8 to "Invited"
   - Google automatically sends them the opt-in email

### **Phase 3: Opt-In Tracking (Days 4-7)**

1. **Monitor opt-ins in Play Console:**
   - Go to **Testing** → **Closed testing** → **Testers** tab
   - Check "Opted-in testers" count

2. **Update spreadsheet when they opt in:**
   - Column 8 → "Opted In"
   - Column 9 → Date they opted in

3. **Send reminders to those who haven't opted in:**
   - After 2 days, text/email: "Hey! Did you get the Google Play beta invite email? Check your spam folder if not!"

4. **Track installations:**
   - When they confirm they installed → Column 8 → "Installed"

### **Phase 4: 14-Day Testing Period (Days 7-21)**

1. **Start date = when you hit 12+ opted-in testers**
   - Note this date somewhere visible
   - Calculate end date (14 days later)

2. **Monitor activity:**
   - Check Supabase or analytics for last login
   - Update Column 10 (Last Active) weekly

3. **Send gentle reminders:**
   - If someone hasn't been active in 3+ days:
     - "Hey! Just checking in - have you had a chance to try YFIT yet? No pressure, but would love to hear what you think!"

4. **Track engagement:**
   - Update Column 8 to "Active" for regular users
   - Add notes in Column 11 about feedback or issues

### **Phase 5: Completion (Day 21+)**

1. **After 14 days with 12+ active testers:**
   - Go to Play Console → **Dashboard** → **Production**
   - Click **"Apply for production"** (should now be enabled)

2. **Grant lifetime Pro access:**
   - For each tester who completed the test:
     - Add their account to Pro tier in Supabase
     - Update Column 12 to "Yes"
     - Send thank you message

3. **Thank your testers:**
   - Send personalized thank you
   - Confirm their lifetime Pro access is active
   - Ask if they'd like to stay on the beta for future updates

---

## 📈 **Progress Tracking**

### **Daily Checklist:**

**Days 1-3 (Recruitment):**
- [ ] Send messages to 15-20 people
- [ ] Track responses in spreadsheet
- [ ] Follow up with non-responders after 2 days
- [ ] Goal: 12+ "Gmail Received" status

**Day 3-4 (Play Console Setup):**
- [ ] Add all Gmail addresses to Play Console
- [ ] Update "Date Added to Play Console" column
- [ ] Verify Google sent opt-in emails

**Days 4-7 (Opt-In Phase):**
- [ ] Monitor opt-in count in Play Console
- [ ] Send reminders to those who haven't opted in
- [ ] Update spreadsheet as people opt in
- [ ] Goal: 12+ "Opted In" status

**Days 7-21 (Testing Period):**
- [ ] Track when 12th person opts in (START DATE)
- [ ] Monitor activity weekly
- [ ] Send engagement reminders if needed
- [ ] Calculate end date (START DATE + 14 days)

**Day 21+ (Completion):**
- [ ] Verify 14 days have passed with 12+ testers
- [ ] Apply for production in Play Console
- [ ] Grant lifetime Pro access to all testers
- [ ] Send thank you messages

---

## 🚨 **Troubleshooting**

### **Problem: Not getting 12 responses**
**Solution:**
- Expand to Tier 3 (Reddit, online communities)
- Offer additional incentive (e.g., "First 12 get early access to exclusive features")
- Ask current testers to refer friends

### **Problem: People agreed but didn't send Gmail**
**Solution:**
- Follow up: "Hey! Can you send me your Gmail address so I can add you to the beta?"
- Make it easy: "Just reply with your @gmail.com email"

### **Problem: People opted in but never installed**
**Solution:**
- Text them: "Hey! Did you have any trouble installing the app? Let me know if you need help!"
- Offer to walk them through it

### **Problem: Testers installed but never used it**
**Solution:**
- Send gentle reminder: "Hey! Would love to hear what you think of YFIT. Even just logging one workout or meal would help!"
- Don't be pushy - some people are just busy

### **Problem: Someone wants to quit mid-test**
**Solution:**
- That's okay! Thank them for their time
- Recruit a replacement quickly
- You need 12 ACTIVE testers for the full 14 days

---

## 📊 **Quick Status Check**

Use this to quickly see where you are:

```
RECRUITMENT PHASE:
☐ 0-5 people contacted
☐ 6-10 people contacted
☐ 11-15 people contacted
☐ 16-20 people contacted

RESPONSE PHASE:
☐ 0-5 people agreed
☐ 6-10 people agreed
☐ 11-15 people agreed (READY!)

PLAY CONSOLE PHASE:
☐ 0-5 Gmail addresses added
☐ 6-10 Gmail addresses added
☐ 12+ Gmail addresses added (READY!)

OPT-IN PHASE:
☐ 0-5 people opted in
☐ 6-10 people opted in
☐ 12+ people opted in (START 14-DAY TIMER!)

TESTING PHASE:
☐ Day 1-7 of testing
☐ Day 8-14 of testing
☐ 14 days complete (APPLY FOR PRODUCTION!)
```

---

## 💡 **Pro Tips**

1. **Over-recruit:** Aim for 15-20 people, not just 12
   - Some will decline
   - Some will opt in but never install
   - Some will install but never use it

2. **Personal touch:** Personalize each message
   - Mention why you thought of them specifically
   - Reference shared interests or experiences

3. **Make it easy:** Remove all friction
   - Just need Gmail address
   - Google handles the rest
   - No complex signup process

4. **Stay organized:** Update spreadsheet daily
   - Set a reminder to check Play Console
   - Track who needs follow-up

5. **Be patient:** People are busy
   - Don't spam them
   - Gentle reminders are okay
   - Thank them for their time

6. **Celebrate milestones:**
   - When you hit 6 testers → "Halfway there!"
   - When you hit 12 testers → "We did it!"
   - When testing completes → "Thank you all!"

---

## 📧 **Quick Copy-Paste Messages**

### **Reminder to opt in (Day 5):**
```
Hey [Name]! Did you get the Google Play beta invite email? It should be from "Google Play" with subject "You're invited to test YFIT AI". Check your spam folder if you don't see it! Let me know if you need me to resend.
```

### **Reminder to install (Day 7):**
```
Hey [Name]! Just checking in - were you able to install YFIT from the beta link? Let me know if you hit any snags!
```

### **Engagement reminder (Day 12):**
```
Hey [Name]! Hope you're enjoying YFIT! If you haven't had a chance to try it yet, no worries - even just logging one workout or meal would be super helpful. Thanks again for being a beta tester!
```

### **Thank you message (Day 21):**
```
Hey [Name]! The 14-day beta test is complete - thank you SO much for helping me get YFIT approved for Google Play! 🎉

As promised, I've granted you lifetime Pro access ($249.99 value). You should see all Pro features unlocked in the app now.

Thanks again for your support - it means the world to me!
```

---

**End of Guide**
