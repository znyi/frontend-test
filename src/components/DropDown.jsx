import * as React from 'react';

const DropDown = (props) => {

 return (

   <div className='portOpenOptionField'>
        <label htmlFor={props.name}>{props.name}</label>
        <select name={props.name} value={props.value} onChange={props.onChange} disabled={props.isDisabled? 'disabled':''}>
            
            {props.items.map((elem, index)=>{
                return (<option key={index} value={elem}>{elem}</option>)
            })}


        </select>

   </div>

 );

};

export default DropDown;