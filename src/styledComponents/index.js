import styled from 'styled-components';

const FlexContainer = styled.div`

    position: relative;
    margin-left: 5px;
    margin-right: 5px;
    height: ${props => props.isSelected ? 'calc(100vh - 400px)' : 'calc(100vh - 100px)'};
    border: 1px solid gray;
`;

// const ChartWrapper = styled.div`
//     position: relative;
//     margin: auto;
//     height: ${props => props.selected ? 'calc(80vh - 300px)' : '80vh'};
// `;
const ChartWrapper = styled.div`
    position: relative;
    margin: auto;
    height: 100%
`;

export { FlexContainer, ChartWrapper }