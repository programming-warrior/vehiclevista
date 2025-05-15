import {useEffect, useState} from "react";


export function useDebounce(value:any,delay=500){
     const [debouncedValue, setDebouncedValue] = useState(value);
     useEffect(()=>{
        const timeout= setTimeout(()=> setDebouncedValue(value), delay);
        return ()=>clearTimeout(timeout)
     },[value])
    //  console.log(debouncedValue);
     return debouncedValue;
}   
