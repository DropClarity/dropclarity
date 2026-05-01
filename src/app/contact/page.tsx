"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const mailtoHref = `mailto:info@dropclarity.com?subject=DropClarity Inquiry&body=Name:${name}%0AEmail:${email}%0A%0A${message}`;

  return (
    <main className="pageWrap">
      <div className="card">
        <h1>Contact Us</h1>
        <p>Questions, support, or want to see DropClarity in action? Reach out anytime.</p>

        <div className="form">
          <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <textarea placeholder="Message" onChange={(e) => setMessage(e.target.value)} />
        </div>

        <a href={mailtoHref}>
          <button className="primaryBtn">Send Message</button>
        </a>

        <p className="subtle">Or email directly: info@dropclarity.com</p>
      </div>

      <style jsx>{`
        .pageWrap {
          min-height: 100vh;
          padding: 100px 20px;
          display: flex;
          justify-content: center;
        }
        .card {
          max-width: 700px;
          width: 100%;
        }
        .form input, .form textarea {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
        }
        .primaryBtn {
          margin-top: 20px;
        }
        .subtle {
          margin-top: 20px;
          opacity: 0.6;
        }
      `}</style>
    </main>
  );
}