# Testing Dummy Traffic Implementation

This guide helps you test the dummy traffic feature to ensure it's working correctly.

## Prerequisites

1. Backend application running on `http://localhost:8080`
2. Frontend application running (typically on `http://localhost:5173`)
3. At least two user accounts created
4. Both users should be able to log in

## Test Steps

### 1. Start the Applications

```bash
# Terminal 1 - Start Backend
cd backend
./mvnw spring-boot:run

# Terminal 2 - Start Frontend  
cd frontend
npm run dev
```

### 2. Monitor Backend Logs

Watch the backend console for dummy traffic related log messages. You should see:
- WebSocket connection events
- Dummy traffic session start/stop events
- Individual dummy message sends

Look for log entries containing:
- `"User {} connected with session {}"`
- `"Starting dummy traffic for session: {}"`
- `"Sending dummy message from {} to {}"`

### 3. Test with Two Users

1. **Open two browser windows/tabs**
2. **Log in as User A** in the first window
3. **Log in as User B** in the second window
4. **Navigate to chat** between User A and User B in both windows
5. **Send a real message** from User A to User B

### 4. Verify Dummy Traffic Behavior

After sending the first real message, you should observe:

#### In Backend Logs:
```
INFO - Starting dummy traffic between users 1 and 2
DEBUG - Sending dummy message from 1 to 2: Just checking in
DEBUG - Sending dummy message from 2 to 1: How's everything?
```

#### In Browser Console (F12 Developer Tools):
```
RECEIVED MESSAGE: {"id":-1,"senderId":1,"recipientId":2,"content":"Just checking in","timestamp":"...","isDummy":true}
Received dummy message - ignoring for UI: {...}
```

#### In the UI:
- **Real messages should appear** in the chat interface
- **Dummy messages should NOT appear** in the chat interface
- **Network traffic should continue** even when no real messages are sent

### 5. Test Disconnection

1. **Close one browser window** (simulating user disconnect)
2. **Check backend logs** for session cleanup:
   ```
   INFO - User 1 disconnected with session abc123
   INFO - Stopped dummy traffic for session: dummy_traffic_1_2
   ```

### 6. Verify Database Integrity

Check that dummy messages are not saved to the database:

```sql
-- Connect to your database and run:
SELECT * FROM chat_message WHERE is_dummy = true;
-- Should return 0 rows

SELECT * FROM chat_message WHERE is_dummy = false OR is_dummy IS NULL;
-- Should only show real messages
```

## Expected Results

✅ **Success Indicators:**
- Real messages appear in both users' chat interfaces
- Dummy messages appear in browser console but not in UI
- Backend logs show dummy traffic session management
- Network traffic continues at random intervals
- Database only contains real messages
- Dummy traffic stops when users disconnect

❌ **Failure Indicators:**
- Dummy messages appear in the chat UI
- No dummy traffic logs in backend
- Dummy messages saved to database
- Application crashes or errors
- No network traffic between real messages

## Troubleshooting

### No Dummy Traffic Generated
- Check that both users are connected via WebSocket
- Verify that a real message was sent between them
- Check backend logs for connection events

### Dummy Messages Appear in UI
- Verify frontend WebSocket service filters `isDummy: true` messages
- Check browser console for filtering logs

### Performance Issues
- Monitor thread pool usage in `DummyTrafficService`
- Adjust timing intervals if needed
- Check for memory leaks in session tracking

### Database Issues
- Verify `ChatMessageService.save()` filters dummy messages
- Check database schema includes `is_dummy` column

## Configuration Tuning

To adjust dummy traffic frequency, modify `DummyMessageService.java`:

```java
// Current settings: 30 seconds to 5 minutes
int minSeconds = 30;
int maxSeconds = 300;

// For testing (faster intervals):
int minSeconds = 5;   // 5 seconds
int maxSeconds = 30;  // 30 seconds
```

## Security Verification

1. **Traffic Analysis**: Use network monitoring tools to verify that message timing patterns are obscured
2. **Content Analysis**: Ensure dummy message content is indistinguishable from real messages in network traffic
3. **Metadata Protection**: Verify that external observers cannot easily determine real vs dummy messages

## Clean Up

After testing:
1. Stop both applications
2. Clear any test data if needed
3. Reset dummy traffic intervals to production values 