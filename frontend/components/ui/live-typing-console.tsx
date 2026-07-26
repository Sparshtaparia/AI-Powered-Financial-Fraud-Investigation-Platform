"use client"
import React, { useState, useEffect } from 'react'

interface LiveTypingConsoleProps {
  prefix?: string
  messages: string[]
}

export function LiveTypingConsole({ prefix = "> TRINETRA AI", messages }: LiveTypingConsoleProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [typedText, setTypedText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const type = () => {
      const fullMessage = messages[currentMessageIndex]

      if (isDeleting) {
        setTypedText(fullMessage.substring(0, typedText.length - 1))
      } else {
        setTypedText(fullMessage.substring(0, typedText.length + 1))
      }

      let typeSpeed = isDeleting ? 25 : 40

      if (!isDeleting && typedText === fullMessage) {
        typeSpeed = 1600 // pause before delete
        setIsDeleting(true)
      } else if (isDeleting && typedText === '') {
        setIsDeleting(false)
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
        typeSpeed = 400 // pause before next typing
      }

      timeout = setTimeout(type, typeSpeed)
    }

    timeout = setTimeout(type, 50)
    return () => clearTimeout(timeout)
  }, [typedText, isDeleting, messages, currentMessageIndex])

  return (
    <div className="font-mono text-[10px] sm:text-xs mb-4 relative break-words whitespace-normal text-electric-mint/90 leading-relaxed">
      {prefix && (
        <div className="text-electric-mint/60 mb-1">{prefix}</div>
      )}
      <div>
        <span>{typedText}</span>
        <span className="text-electric-mint animate-blink-cursor">_</span>
      </div>
    </div>
  )
}
