import smtplib
from email.mime.text import MIMEText
import sys

# Email configuration
SENDER_EMAIL = ""
SENDER_PASSWORD = ""
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def send_verification_code(email, code):
    try:
        subject = "رمز التحقق - الخاص بتغيير كلمة السر"
        body = f"""
        <html>
            <body>
                <h2>رمز التحقق</h2>
                <p> رمز التحقق الخاص بك: <strong>{code}</strong></p>
                <p>مدة صلاحية الكود 15 دقيقة فقط</p>
            </body>
        </html>
        """
        
        msg = MIMEText(body, 'html')
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = email
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, email, msg.as_string())
        
        print("Verification code sent successfully")
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python send_verification.py <email> <code>")
        sys.exit(1)
    
    email = sys.argv[1]
    code = sys.argv[2]
    
    if send_verification_code(email, code):
        sys.exit(0)
    else:
        sys.exit(1)