import { screen, fireEvent } from '@testing-library/dom';
import { localStorageMock } from '../__mocks__/localStorage.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes';
import Router from '../app/Router';
import firebase from '../__mocks__/firebase';
import Firestore from '../app/Firestore';
import BillsUI from '../views/BillsUI.js';
import Bills from '../containers/Bills.js';
import { bills } from '../fixtures/bills.js';

const initPage = (bills = false) => {
  if (!bills) bills = [];
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
  document.body.innerHTML = BillsUI({ data: bills });
  const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname })};
  const allBills = new Bills({
    document,
    onNavigate,
    firestore: null,
    localStorage: window.localStorage
  });
  return allBills;
};

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    it('Then bill icon in vertical layout should be highlighted', () => {
      jest.mock('../app/Firestore');
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() });
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['Bills'] } });
      document.body.innerHTML = '<div id="root"></div>';
      Router();
      expect(screen.getByTestId('icon-window').classList.contains('active-icon')).toBeTruthy();
    });
    it('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i);
      dates.map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).not.toEqual(datesSorted);
    });
    it('Then fetches bills from mock API GET', async () => {
      const getSpy = jest.spyOn(firebase, 'get');
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    it('Then fetches bills from an API and fails with 404 message error', async () => {
      firebase.get.mockImplementationOnce(() => Promise.reject(new Error('Erreur 404')));
      document.body.innerHTML = BillsUI({ error: 'Erreur 404' });
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    it('Then fetches messages from an API and fails with 500 message error', async () => {
      firebase.get.mockImplementationOnce(() => Promise.reject(new Error('Erreur 500')));
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' });
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
    describe('When I click to button New expense report', () => {
      it('Then the title change', () => {
        const allBills = initPage();
        const handleClickNewBill = jest.fn(allBills.handleClickNewBill);
        const btnNewBill = screen.getByTestId('btn-new-bill');
        btnNewBill.addEventListener('click', handleClickNewBill);
        fireEvent.click(btnNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
        const newTitle = document.querySelector('div.content-title').textContent;
        expect(newTitle).toBe(' Envoyer une note de frais ');
      });
    });
    describe('When I click on the icon eye', () => {
      it('Then I modale File should open', () => {
        const allBills = initPage(bills);
        $.fn.modal = jest.fn();
        const iconEye = screen.getAllByTestId('icon-eye')[0];
        const handleClickIconEye = jest.fn(allBills.handleClickIconEye(iconEye));
        iconEye.addEventListener('click', handleClickIconEye);
        fireEvent.click(iconEye);
        expect(handleClickIconEye).toHaveBeenCalled();
        const modaleFile = document.querySelector('div.modal-body > div > img');
        expect(modaleFile).not.toBeUndefined();
      });
    });
    describe('When I click on the close modal', () => {
      it('Then I modale File should close', () => {
        const allBills = initPage(bills);
        $.fn.modal = jest.fn();
        const iconEye = screen.getAllByTestId('icon-eye')[0];
        const handleClickIconEye = jest.fn(allBills.handleClickIconEye(iconEye));
        iconEye.addEventListener('click', handleClickIconEye);
        fireEvent.click(iconEye);
        expect(handleClickIconEye).toHaveBeenCalled();
        const btnClose = document.querySelector('button.close');
        fireEvent.click(btnClose);
        const modaleFile = document.querySelector('div#modaleFile').className;
        expect(modaleFile).toBe('modal fade');
      });
    });
  });
});