// import React from 'react'
// import { useState } from 'react';
// import { Link } from 'react-router-dom';

// const BasePage = () => {
//     const [isLogin, setIsLogin] = useState(true);
//   return (
//     <div style={{ padding: '20px' }}>
//             {isLogin ? (
//                 <>
//                     {/* <Login /> */}
                    
//                     <Link to="/login"/>
//                     <p>
//                         Don't have an account? 
//                         <button onClick={() => setIsLogin(false)}>Register here</button>
//                     </p>
//                 </>
//             ) : (
//                 <>
//                     {/* <Register onRegisterSuccess={() => setIsLogin(true)} /> */}
//                     <Link to="/register" state={{onRegisterSuccess: () => setIsLogin(true)}}/>

//                     <p>
//                         Already have an account? 
//                         <button onClick={() => setIsLogin(true)}>Login here</button>
//                     </p>
//                 </>
//             )}
//         </div>
//   )
// }

// export default BasePage