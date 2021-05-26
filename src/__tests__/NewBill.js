import { screen, fireEvent } from '@testing-library/dom';
import { localStorageMock } from '../__mocks__/localStorage.js';
import { ROUTES } from '../constants/routes';
import firebase from '../__mocks__/firebase';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import BillsUI from '../views/BillsUI.js';

const initPage = () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
  const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) };
  document.body.innerHTML = NewBillUI(); 
  const newBill = new NewBill({
    document,
    onNavigate,
    firestore: false,
    localStorage: window.localStorage,
  });
  return newBill;
};

describe('Given I am connected as an employee', () => {
  describe('Given I am on NewBill Page', () => {
    describe('When I add a file in inputFile', () => {
      it('Then this new file should have been changed in the input file', () => {
        const newBill = initPage();
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const inputFile = screen.getByTestId('file');
        inputFile.addEventListener('change', handleChangeFile);
        fireEvent.change(inputFile, { target: { files: [new File(['image.jpg'], 'image.jpg', { type: 'image/jpg' })] } });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(inputFile.files[0].name).toBe('image.jpg');
      });
      it('Then the bill shouldn\'t be created and I stay on the NewBill page', () => {
        const newBill = initPage();
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const inputFile = screen.getByTestId('file');
        inputFile.addEventListener('change', handleChangeFile);
        fireEvent.change(inputFile, { target: { files: [new File(['document.pdf'], 'document.pdf', { type: 'Chrome HTML Document (.pdf)' })] } });
        expect(handleChangeFile).toHaveBeenCalled();
        const submitBtn = document.querySelector('button#btn-send-bill').style.display;
        expect(submitBtn).toBe('none');
      });
    });
    it('Then click to button submit', () => {
      const newBill = initPage();
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const submitBtn = screen.getByTestId('form-new-bill');
      submitBtn.addEventListener('submit', handleSubmit);
      fireEvent.submit(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
  describe('When I create a new bill', () => {
    it('Then add bill to mock API POST', async () => {
      const getSpyPost = jest.spyOn(firebase, 'post');
      const newBill = {
        id: "azertyui57dsfgxfctes",
        status: "refused",
        pct: 87,
        amount: 91,
        email: "azerty@test.fr",
        name: "Test",
        vat: "89",
        fileName: "factureEDF2021.png",
        date: "2021-05-24",
        commentAdmin: "à valider",
        commentary: "Test 1",
        type: "Transports",
        fileUrl: "https://saving.com"
      };
      const bills = await firebase.post(newBill);
      expect(getSpyPost).toHaveBeenCalledTimes(1);
      expect(bills.data[0]).toEqual(newBill);
    });
    it('Then add bill to API and fails with 404 message error', async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error('Erreur 404')));
      document.body.innerHTML = BillsUI({ error: 'Erreur 404' });
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    it('Then add bill to API and fails with 500 message error', async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error('Erreur 404')));
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' });
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});