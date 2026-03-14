import React from "react";
import './globals.css'
interface ReactLayoutChildren{
  children:React.ReactNode
}

const RootLayout = ({children}:ReactLayoutChildren) => {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html> 
  )
}

export default RootLayout