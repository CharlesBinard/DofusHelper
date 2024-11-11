// src/styles.ts

import styled from 'styled-components';

export const Container = styled.div`
  padding: 0px;
  font-family: Arial, sans-serif;
  height: 100%;
  width: fit-content;
`;

export const Accordion = styled.div`
  margin-bottom: 20px;
  border-radius: 4px;
`;

export const AccordionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
`;

export const AccordionContent = styled.div`
  margin-top: 10px;
  padding: 10px 0;
  border-top: 1px solid #ccc;
  border-radius: 5px;
  background-color: rgba(255,255,255, 0.1);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;


export const WindowList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  justify-content: center;
`;

export const WindowItem = styled.div<{ isSelected: boolean }>`
  padding: 3px;
  cursor: pointer;
  border-radius: 5px;

  display: flex;
  gap: 5px;
  width: 100%;
  min-width: max-content;

  background-color: #fafafa;
  border: 2px solid #ccc;
  align-items: center;

  ${({ isSelected }) => isSelected && `
      background-color: #c4c4c4;
      border: 2px solid white;
  `}

  img {
    width: 30px;
    height: 30px;
    object-fit: cover;
  }

  p {
    margin: 5px 0 0 0;
    font-size: 14px;
  }

  &:hover {
    background-color: #f0f0f0;
    border: 2px solid #8c8c68;
  }
`;


export const ShortcutInputBlock = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  p {
    margin: 0;
  }
`;

export const IconButton = styled.button`
  margin-top: 10px;
  padding: 8px 12px;
  cursor: pointer;
  background-color: #445363;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
  img {
    width: 15px;
    height: 15px;
    object-fit: contain;
  }
`;

export const ShortcutGroup = styled.div`
  margin-top: 15px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;

  label {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  div {
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;


export const SettingsGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  flex-wrap: wrap;
  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
    font-size: 14px;


    input[type='checkbox'] {
      width: 18px;
      height: 18px;
    }
  }
`;



