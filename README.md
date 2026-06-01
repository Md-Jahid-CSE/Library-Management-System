# 📚 Library Management System v2
## Updated Roles + Registration System

---

## নতুন কী আছে v2 তে:

✅ **Librarian** — সব কিছু control করে (আগের Admin)
✅ **Library Assistant** — বই issue/return করে (আগের Librarian)
✅ **Student** — নিজে Register করতে পারে, Batch field আছে
✅ **Staff** — নিজে Register করতে পারে, Batch field নেই
✅ **Approval System** — Student/Staff register করলে Librarian approve করতে হবে
✅ **My Borrows** — Student/Staff নিজের borrow history দেখতে পারবে

---

## ধাপ ১ — MySQL Workbench এ নতুন Schema Run করুন

```sql
-- backend/schema.sql ফাইলের সব code run করুন
-- এটা পুরনো tables মুছে নতুন করে বানাবে
```

---

## ধাপ ২ — Backend চালু করুন

```bash
cd backend
npm install
npm run dev
```

---

## ধাপ ৩ — Frontend চালু করুন

```bash
cd frontend
npm install --legacy-peer-deps
npm install ajv@^8 --legacy-peer-deps
npm start
```

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Librarian | librarian@library.com | password |
| Library Assistant | assistant@library.com | password |

---

## Student/Staff Registration

1. Login page এ "Create Account" click করুন
2. Student বা Staff select করুন
3. সব information দিন
4. Submit করুন
5. Librarian approve করলে login করতে পারবেন
